const express = require('express');
const router = express.Router();
const airtable = require('../lib/airtableClient');

// GET /api/demos - list all demo records
router.get('/', async (req, res) => {
  try {
    const demos = await airtable.listDemos();
    res.json({ demos });
  } catch (err) {
    console.error('Failed to list demos:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch demos from Airtable.' });
  }
});

// POST /api/demos - create a new demo entry
router.post('/', async (req, res) => {
  try {
    const demo = await airtable.createDemo(req.body);
    res.status(201).json({ demo });
  } catch (err) {
    console.error('Failed to create demo:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to save demo to Airtable.' });
  }
});

// PATCH /api/demos/:id - update an existing demo (e.g. change status)
router.patch('/:id', async (req, res) => {
  try {
    const demo = await airtable.updateDemo(req.params.id, req.body);
    res.json({ demo });
  } catch (err) {
    console.error('Failed to update demo:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to update demo in Airtable.' });
  }
});

// DELETE /api/demos/:id - remove a demo entry
router.delete('/:id', async (req, res) => {
  try {
    const result = await airtable.deleteDemo(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Failed to delete demo:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to delete demo from Airtable.' });
  }
});

module.exports = router;
