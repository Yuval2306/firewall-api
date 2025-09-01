import { Request, Response } from 'express';
import { PostgresService } from '../services/PostgresService';

export class FirewallController {
  static async addRule(req: Request, res: Response) {
    try {
      const { values, mode } = req.body;
      const type = req.path.split('/').pop();

      if (!values || !Array.isArray(values) || !mode) {
        return res.status(400).json({ 
          error: 'Missing required fields: values (array) and mode' 
        });
      }

      if (!['blacklist', 'whitelist'].includes(mode)) {
        return res.status(400).json({ 
          error: 'Mode must be either blacklist or whitelist' 
        });
      }

      for (const value of values) {
        await PostgresService.createRule({
          type: type as 'ip' | 'url' | 'port',
          value: String(value),
          mode
        });
      }

      res.json({
        type,
        mode,
        values,
        status: 'success'
      });
    } catch (error) {
      console.error('Error adding rule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async removeRule(req: Request, res: Response) {
    try {
      const { values, mode } = req.body;
      const type = req.path.split('/').pop();

      if (!values || !Array.isArray(values) || !mode) {
        return res.status(400).json({ 
          error: 'Missing required fields: values (array) and mode' 
        });
      }

      const deletedRules = await PostgresService.deleteRules(
        type as string,
        values.map(String),
        mode
      );

      res.json({
        type,
        mode,
        values,
        status: 'success',
        deleted: deletedRules.length
      });
    } catch (error) {
      console.error('Error removing rule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAllRules(req: Request, res: Response) {
    try {
      const rules = await PostgresService.getAllRules();
      res.json(rules);
    } catch (error) {
      console.error('Error getting rules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateRuleStatus(req: Request, res: Response) {
    try {
      const updates = req.body;
      const result = await PostgresService.updateRuleStatus(updates);
      res.json(result);
    } catch (error) {
      console.error('Error updating rule status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}