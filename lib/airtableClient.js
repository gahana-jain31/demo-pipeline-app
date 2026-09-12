const axios = require('axios');

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID || 'tblDtikni79fmWTpA';

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  console.warn(
    '[airtableClient] Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID. ' +
    'Copy .env.example to .env and fill in your credentials before using the app.'
  );
}

const client = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`,
  headers: {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Maps friendly field names (used by our frontend/API) to Airtable's internal field IDs.
// These IDs are schema identifiers, not secrets - safe to keep in code.
const FIELDS = {
  school: 'fldQarJne8Pznw1VT',
  date: 'fld83C8XMW38wGxJg',
  time: 'fldfO2rkvJN6GgBZf',
  mode: 'fldNTcgbi5CC1jP9v',
  city: 'fldblEVlDf9oG0SWl',
  state: 'fldVYxj5reS1S3ejc',
  address: 'fldQ8HGVUvTPXVAZO',
  board: 'fldFPwqZIYqYW0MKP',
  management: 'flduKijcZ99mWBcYE',
  studentStrength: 'fld5mwWpdQlLtvAut',
  contactName: 'fld3ICEKBbsom29Ba',
  contactPhone: 'fldCS0JqztDFAp0mb',
  contactEmail: 'fld83tJ0usLLvy46k',
  requirement: 'fldMBfMWfYCl1lIv8',
  allottedBy: 'fld9XAkfojHInQ3yE',
  demoBy: 'fldG34OMYu7BM0VlF',
  salesLead: 'fldIveXeCVhRGohBT',
  itBy: 'fldn6Y3Vwu60bnGqr',
  meetingLink: 'fld2GXbJ59B2NfXSI',
  leadQuality: 'fldPjZE2VpLUUwFQQ',
  status: 'fldGXonUghkKi7eTT',
  remarks: 'fld2lBV00J95OtZth',

  // --- New fields ---
  // These three are NOT yet real Airtable field IDs — they are placeholders.
  // 1. In your Airtable base, add three new columns to the Demos table:
  //      "Staff Number"      (Number field)
  //      "Rescheduled Date"  (Date field)
  //      "Rescheduled Time"  (Single line text field)
  // 2. Open each column's field in Airtable, click "..." > "Copy field ID"
  //    (or check the API docs page for the base), and paste the real
  //    fld... ID in place of the placeholder strings below.
  // Until you do this, saving/loading these three fields will silently
  // no-op (they just won't sync to Airtable) rather than break the app.
  staffNumber: 'fldSTAFFNUMBERPLACEHOLDER',
  rescheduledDate: 'fldRESCHEDDATEPLACEHOLDER',
  rescheduledTime: 'fldRESCHEDTIMEPLACEHOLDER',
};

const FIELD_ID_TO_NAME = Object.fromEntries(
  Object.entries(FIELDS).map(([name, id]) => [id, name])
);

function toAirtableFields(friendlyFields) {
  const out = {};
  for (const [key, value] of Object.entries(friendlyFields)) {
    const fieldId = FIELDS[key];
    // Skip fields whose Airtable field ID hasn't been set up yet (see the
    // "New fields" placeholders above) - sending a fake field ID would make
    // Airtable reject the *entire* save, not just that one field.
    if (fieldId && !fieldId.includes('PLACEHOLDER') && value !== undefined && value !== '') {
      out[fieldId] = value;
    }
  }
  return out;
}

function fromAirtableRecord(record) {
  const friendly = { id: record.id, createdTime: record.createdTime };
  for (const [fieldId, value] of Object.entries(record.fields || {})) {
    const name = FIELD_ID_TO_NAME[fieldId];
    if (name) friendly[name] = value;
  }
  return friendly;
}

async function listDemos() {
  const records = [];
  let offset;
  do {
    const { data } = await client.get(`/${AIRTABLE_TABLE_ID}`, {
      params: { pageSize: 100, offset, returnFieldsByFieldId: true },
    });
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records.map(fromAirtableRecord);
}

async function createDemo(friendlyFields) {
  const { data } = await client.post(
    `/${AIRTABLE_TABLE_ID}`,
    { records: [{ fields: toAirtableFields(friendlyFields) }] },
    { params: { returnFieldsByFieldId: true } }
  );
  return fromAirtableRecord(data.records[0]);
}

async function updateDemo(recordId, friendlyFields) {
  const { data } = await client.patch(
    `/${AIRTABLE_TABLE_ID}`,
    { records: [{ id: recordId, fields: toAirtableFields(friendlyFields) }] },
    { params: { returnFieldsByFieldId: true } }
  );
  return fromAirtableRecord(data.records[0]);
}

async function deleteDemo(recordId) {
  await client.delete(`/${AIRTABLE_TABLE_ID}`, { params: { records: [recordId] } });
  return { id: recordId, deleted: true };
}

module.exports = { listDemos, createDemo, updateDemo, deleteDemo, FIELDS };
