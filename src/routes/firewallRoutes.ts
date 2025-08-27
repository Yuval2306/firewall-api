import express from 'express';
import { FirewallController } from '../controllers/firewallController';

const router = express.Router();

router.post('/firewall/ip', FirewallController.addRule);
router.delete('/firewall/ip', FirewallController.removeRule);

router.post('/firewall/url', FirewallController.addRule);
router.delete('/firewall/url', FirewallController.removeRule);

router.post('/firewall/port', FirewallController.addRule);
router.delete('/firewall/port', FirewallController.removeRule);

router.get('/firewall/rules', FirewallController.getAllRules);

router.put('/firewall/rules', FirewallController.updateRuleStatus);

export default router;