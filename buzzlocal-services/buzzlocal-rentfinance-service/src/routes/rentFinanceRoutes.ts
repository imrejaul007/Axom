import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RentCredit, DepositGuarantee, RentPaymentHistory, GuaranteeApplication } from '../models/RentFinanceModels';

const router = Router();

function getUserId(req: Request): string {
  return req.headers['x-user-id'] as string || 'anonymous';
}

// Calculate trust level from score
function getTrustLevel(score: number): string {
  if (score >= 90) return 'platinum';
  if (score >= 75) return 'gold';
  if (score >= 50) return 'silver';
  return 'bronze';
}

// Calculate credit limit from score
function getCreditLimit(score: number): number {
  if (score >= 90) return 500000;   // 5L
  if (score >= 75) return 300000;  // 3L
  if (score >= 50) return 150000;  // 1.5L
  return 50000;                     // 50K
}

// ==================== RENT CREDIT SCORE ====================

// GET /api/rentfinance/credit-score - Get user's credit score
router.get('/credit-score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    let credit = await RentCredit.findOne({ userId });

    if (!credit) {
      // Create default credit profile
      credit = new RentCredit({
        userId,
        totalScore: 0,
        trustLevel: 'bronze',
        status: 'active'
      });
      await credit.save();
    }

    res.json({
      success: true,
      credit: {
        score: credit.totalScore,
        level: credit.trustLevel,
        limit: credit.creditLimit,
        eligibleDeposits: credit.eligibleDeposits,
        status: credit.status,
        verified: credit.verified,
        breakdown: {
          paymentHistory: credit.paymentHistory,
          tenureScore: credit.tenureScore,
          incomeVerification: credit.incomeVerification,
          socialScore: credit.socialScore,
          societyBehavior: credit.societyBehavior
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/rentfinance/credit-score/update - Update score manually (demo)
router.post('/credit-score/update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { paymentHistory, tenure, income, social, society } = req.body;

    let credit = await RentCredit.findOne({ userId });
    if (!credit) {
      credit = new RentCredit({ userId });
    }

    credit.paymentHistory = Math.min(40, paymentHistory ?? credit.paymentHistory);
    credit.tenureScore = Math.min(20, tenure ?? credit.tenureScore);
    credit.incomeVerification = Math.min(15, income ?? credit.incomeVerification);
    credit.socialScore = Math.min(10, social ?? credit.socialScore);
    credit.societyBehavior = Math.min(15, society ?? credit.societyBehavior);

    const total = credit.paymentHistory + credit.tenureScore + credit.incomeVerification +
                  credit.socialScore + credit.societyBehavior;

    credit.totalScore = total;
    credit.trustLevel = getTrustLevel(total) as any;
    credit.creditLimit = getCreditLimit(total);
    credit.verified = true;
    credit.verifiedAt = new Date();
    credit.status = 'active';

    await credit.save();

    res.json({
      success: true,
      credit: {
        score: total,
        level: credit.trustLevel,
        limit: credit.creditLimit,
        eligibleDeposits: credit.eligibleDeposits
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== ZERO DEPOSIT CHECK ====================

// POST /api/rentfinance/check-eligibility - Check if user can get zero deposit
router.post('/check-eligibility', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { depositAmount } = req.body;

    let credit = await RentCredit.findOne({ userId });
    if (!credit) {
      credit = new RentCredit({ userId, totalScore: 30 });
      await credit.save();
    }

    const eligible = credit.totalScore >= 50;
    const canCoverAmount = credit.creditLimit >= (depositAmount || 0);

    let trustLevel = 'bronze';
    if (credit.totalScore >= 90) trustLevel = 'platinum';
    else if (credit.totalScore >= 75) trustLevel = 'gold';
    else if (credit.totalScore >= 50) trustLevel = 'silver';

    res.json({
      success: true,
      eligible,
      canCoverAmount,
      depositAmount: depositAmount || 0,
      userScore: credit.totalScore,
      trustLevel,
      creditLimit: credit.creditLimit,
      message: eligible
        ? `You are eligible for zero deposit! Your ${trustLevel} trust score covers up to Rs ${(credit.creditLimit / 1000).toFixed(0)}K`
        : 'Build your rent credit score to unlock zero deposit'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== DEPOSIT GUARANTEE ====================

// POST /api/rentfinance/guarantee/apply - Apply for deposit guarantee
router.post('/guarantee/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { propertyId, landlordId, depositAmount, monthlyRent } = req.body;

    // Check eligibility
    let credit = await RentCredit.findOne({ userId });
    if (!credit || credit.totalScore < 50) {
      return res.status(400).json({
        error: 'Insufficient credit score. Minimum 50 required for deposit guarantee.',
        currentScore: credit?.totalScore || 0
      });
    }

    if (depositAmount > credit.creditLimit) {
      return res.status(400).json({
        error: `Deposit amount exceeds your credit limit of Rs ${credit.creditLimit.toLocaleString()}`,
        creditLimit: credit.creditLimit
      });
    }

    // Create application
    const application = new GuaranteeApplication({
      userId,
      propertyId,
      landlordId,
      depositAmount,
      monthlyRent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    await application.save();

    res.json({
      success: true,
      application: {
        id: application._id,
        status: application.status,
        expiresAt: application.expiresAt,
        message: 'Application submitted. Landlord approval pending.'
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/rentfinance/guarantee/approve/:id - Landlord approves
router.post('/guarantee/approve/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    const application = await GuaranteeApplication.findOne({ _id: req.params.id, landlordId: userId });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Create guarantee
    const guarantee = new DepositGuarantee({
      userId: application.userId,
      landlordId: application.landlordId,
      propertyId: application.propertyId,
      depositAmount: application.depositAmount,
      guaranteeId: `ZG-${uuidv4().substring(0, 8).toUpperCase()}`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000) // 12 months
    });

    await guarantee.save();

    // Update application
    application.status = 'approved';
    application.approvedAt = new Date();
    await application.save();

    // Update credit
    const credit = await RentCredit.findOne({ userId: application.userId });
    if (credit) {
      credit.eligibleDeposits += 1;
      credit.totalDepositsCovered += 1;
      await credit.save();
    }

    res.json({
      success: true,
      guarantee: {
        id: guarantee._id,
        guaranteeId: guarantee.guaranteeId,
        depositAmount: guarantee.depositAmount,
        status: guarantee.status,
        validUntil: guarantee.endDate
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/rentfinance/guarantee/my-guarantees - User's guarantees
router.get('/guarantee/my-guarantees', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const guarantees = await DepositGuarantee.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, guarantees });
  } catch (error) {
    next(error);
  }
});

// GET /api/rentfinance/guarantee/landlord-guarantees - Landlord's guarantees
router.get('/guarantee/landlord-guarantees', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const guarantees = await DepositGuarantee.find({ landlordId: userId }).sort({ createdAt: -1 });
    res.json({ success: true, guarantees });
  } catch (error) {
    next(error);
  }
});

// ==================== PAYMENT HISTORY ====================

// POST /api/rentfinance/payments - Record rent payment
router.post('/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { propertyId, amount, paidOn, month, paymentMethod, transactionId } = req.body;

    const paidDate = new Date(paidOn || Date.now());
    const dueDate = new Date(month);
    dueDate.setDate(10); // Rent due on 10th

    const daysLate = Math.max(0, Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    const onTime = paidDate <= dueDate;

    // Get previous payment for streak
    const lastPayment = await RentPaymentHistory.findOne({
      userId,
      propertyId
    }).sort({ month: -1 });

    const streak = onTime ? (lastPayment?.streak || 0) + 1 : 0;

    const payment = new RentPaymentHistory({
      userId,
      propertyId,
      amount,
      paidOn: paidDate,
      onTime,
      daysLate,
      month: new Date(month),
      paymentMethod,
      transactionId,
      streak
    });

    await payment.save();

    // Update credit score
    await updateCreditScore(userId);

    res.json({
      success: true,
      payment: {
        id: payment._id,
        onTime,
        daysLate,
        streak,
        message: onTime
          ? `On time! ${streak} month streak`
          : `${daysLate} days late. Late payments affect your score.`
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/rentfinance/payments - Payment history
router.get('/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { propertyId, limit = 12 } = req.query;

    const query: Record<string, unknown> = { userId };
    if (propertyId) query.propertyId = propertyId;

    const payments = await RentPaymentHistory.find(query)
      .sort({ month: -1 })
      .limit(Number(limit));

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const onTimeCount = payments.filter(p => p.onTime).length;
    const streak = payments[0]?.streak || 0;

    res.json({
      success: true,
      payments,
      summary: {
        totalPaid,
        onTimePercentage: payments.length ? Math.round((onTimeCount / payments.length) * 100) : 100,
        currentStreak: streak
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update credit score based on payment history
async function updateCreditScore(userId: string) {
  let credit = await RentCredit.findOne({ userId });
  if (!credit) {
    credit = new RentCredit({ userId });
  }

  const payments = await RentPaymentHistory.find({ userId }).sort({ month: -1 }).limit(12);
  const onTimePayments = payments.filter(p => p.onTime).length;
  const totalPayments = payments.length;

  // Payment history: 0-40 points
  const paymentScore = totalPayments > 0 ? Math.round((onTimePayments / totalPayments) * 40) : 0;

  // Tenure: 0-20 points (1 point per month, max 20)
  const tenureMonths = payments.length;
  const tenureScore = Math.min(20, tenureMonths * 2);

  // Other scores (placeholder)
  const incomeScore = credit.incomeVerification;
  const socialScore = credit.socialScore;
  const societyScore = credit.societyBehavior;

  const total = paymentScore + tenureScore + incomeScore + socialScore + societyScore;

  credit.paymentHistory = paymentScore;
  credit.tenureScore = tenureScore;
  credit.totalScore = total;
  credit.trustLevel = getTrustLevel(total) as any;
  credit.creditLimit = getCreditLimit(total);

  if (!credit.firstRentDate && payments.length > 0) {
    credit.firstRentDate = payments[payments.length - 1].month;
  }

  await credit.save();
}

// ==================== STATS ====================

// GET /api/rentfinance/stats - Overall stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    const credit = await RentCredit.findOne({ userId });
    const guarantees = await DepositGuarantee.find({ userId });
    const payments = await RentPaymentHistory.find({ userId });

    const activeGuarantees = guarantees.filter(g => g.status === 'active').length;
    const totalGuaranteed = guarantees.reduce((sum, g) => sum + g.depositAmount, 0);

    res.json({
      success: true,
      stats: {
        creditScore: credit?.totalScore || 0,
        trustLevel: credit?.trustLevel || 'bronze',
        creditLimit: credit?.creditLimit || 0,
        activeGuarantees,
        totalGuaranteed,
        totalPayments: payments.length,
        onTimeRate: payments.length > 0
          ? Math.round((payments.filter(p => p.onTime).length / payments.length) * 100)
          : 100
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
