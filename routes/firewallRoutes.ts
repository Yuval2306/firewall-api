import express from 'express';
import { FirewallController } from '../controllers/firewallController';

const router = express.Router();

// Routes עבור IPs
router.post('/firewall/ip', FirewallController.addRule);
router.delete('/firewall/ip', FirewallController.removeRule);

// Routes עבור URLs
router.post('/firewall/url', FirewallController.addRule);
router.delete('/firewall/url', FirewallController.removeRule);

// Routes עבור Ports
router.post('/firewall/port', FirewallController.addRule);
router.delete('/firewall/port', FirewallController.removeRule);

// Route לקבלת כל החוקים
router.get('/firewall/rules', FirewallController.getAllRules);

// Route לעדכון סטטוס חוקים
router.put('/firewall/rules', FirewallController.updateRuleStatus);

export default router;