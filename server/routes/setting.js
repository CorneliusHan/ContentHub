const express = require('express');
const SettingService = require('../services/SettingService');
const { body, validationResult } = require('express-validator')

const router = express.Router();

router.get('/', async (req, res, next) => {
    const settingService = new SettingService();
    try {
        return res.send({ settings: await settingService.getSetting() });
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    const settingService = new SettingService();
    try {
        await settingService.addSetting(req.body.settingName, req.body.settingValue);
        return res.send();
    } catch (e) {
        res.status(400).send('setting exists.');
        return next(e);
    }
});

router.patch('/',[
    body('settingValue').exists().isInt({gt:0}).withMessage('Please enter a positive integer.')
], async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    const settingService = new SettingService();
    try {
        await settingService.updateSetting(req.body.settingName, req.body.settingValue);
        return res.send();
    } catch (e) {
        return next(e);
    }
});

router.delete('/:name', async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const settingService = new SettingService();
    try {
        const settingDeleted = await settingService.deleteSetting(req.params.id);
        if (settingDeleted < 1) return res.status(404).send('Setting not found.');
        return res.send();
    } catch (e) {
        return next(e);
    }
});

module.exports = router;
