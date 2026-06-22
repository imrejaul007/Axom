import { Router, Request, Response } from 'express';
import { dashboardService } from '../services/DashboardService';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'merchant-dashboard' });
});

// ===== DASHBOARD =====

// GET /api/dashboard/:merchantId - Get merchant dashboard
router.get('/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const dashboard = await dashboardService.getDashboard(merchantId);
    res.json({ success: true, dashboard });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/dashboard/:merchantId/stats - Update stats
router.put('/:merchantId/stats', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const stats = req.body;
    await dashboardService.updateStats(merchantId, stats);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== DEMAND & HEATMAP =====

// GET /api/dashboard/heatmap - Get area demand heatmap
router.get('/heatmap/live', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 5;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'lat and lng required' });
    }

    const result = await dashboardService.getAreaDemandHeatmap(lat, lng, radius);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== PREDICTIONS =====

// GET /api/dashboard/predictions/:areaId - Get footfall prediction
router.get('/predictions/:areaId', async (req: Request, res: Response) => {
  try {
    const { areaId } = req.params;
    const days = parseInt(req.query.days as string) || 7;
    const predictions = await dashboardService.getFootfallPrediction(areaId, days);
    res.json(predictions);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/dashboard/timing/:areaId - Get optimal deal timing
router.get('/timing/:areaId', async (req: Request, res: Response) => {
  try {
    const { areaId } = req.params;
    const timing = await dashboardService.getOptimalDealTiming(areaId);
    res.json(timing);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== COMPETITOR ANALYSIS =====

// GET /api/dashboard/competitors/:merchantId/:areaId - Get competitor analysis
router.get('/competitors/:merchantId/:areaId', async (req: Request, res: Response) => {
  try {
    const { merchantId, areaId } = req.params;
    const analysis = await dashboardService.getCompetitorAnalysis(merchantId, areaId);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== EVENT IMPACT =====

// GET /api/dashboard/event-impact/:areaId - Get event impact analysis
router.get('/event-impact/:areaId', async (req: Request, res: Response) => {
  try {
    const { areaId } = req.params;
    const eventId = req.query.eventId as string;
    const impact = await dashboardService.getEventImpact(areaId, eventId);
    res.json(impact);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== RECOMMENDATIONS =====

// GET /api/dashboard/recommendations/:merchantId - Get merchant recommendations
router.get('/recommendations/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const areaId = req.query.areaId as string || 'unknown';
    const recommendations = await dashboardService.getRecommendations(merchantId, areaId);
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as dashboardRoutes };
