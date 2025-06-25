import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

interface PricingRequest extends Request {
  body: {
    productId: string;
    name: string;
    amount: number;
    currency: string;
    type: 'one_time' | 'recurring';
    installation_id?: string;
  }
}

// Add pricing to existing product
router.post('/api/products/:productId/pricing', async (req: PricingRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { name, amount, currency = 'USD', type = 'one_time', installation_id } = req.body;

    if (!name || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Name and amount are required'
      });
    }

    // For Railway backend integration
    if (installation_id) {
      try {
        const railwayResponse = await axios.post(`https://dir.engageautomations.com/api/products/${productId}/prices`, {
          installation_id,
          name,
          type,
          amount: Math.round(amount * 100), // Convert to cents
          currency
        });

        return res.json(railwayResponse.data);
      } catch (railwayError) {
        console.error('Railway pricing failed:', railwayError.response?.data);
        return res.status(500).json({
          success: false,
          error: 'Failed to add pricing via Railway backend'
        });
      }
    }

    // Direct implementation would go here
    res.json({
      success: true,
      message: 'Pricing endpoint ready',
      productId,
      pricing: { name, amount, currency, type }
    });

  } catch (error) {
    console.error('Pricing endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get pricing for product
router.get('/api/products/:productId/pricing', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { installation_id } = req.query;

    if (installation_id) {
      try {
        const railwayResponse = await axios.get(`https://dir.engageautomations.com/api/products/${productId}/prices`, {
          params: { installation_id }
        });

        return res.json(railwayResponse.data);
      } catch (railwayError) {
        return res.status(404).json({
          success: false,
          error: 'No pricing found'
        });
      }
    }

    res.json({
      success: true,
      prices: [],
      message: 'Pricing retrieval ready'
    });

  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as pricingRouter };