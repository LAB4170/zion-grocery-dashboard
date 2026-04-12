/**
 * Universal Category Profiles
 * Defines the schema, validation, and feature sets for different business types.
 */
const CATEGORY_PROFILES = {
  retail: {
    label: 'Standard Retail',
    metadata_fields: [],
    features: ['inventory', 'sales', 'expenses']
  },
  pharmacy: {
    label: 'Pharmacy',
    metadata_fields: [
      { key: 'batch_no', label: 'Batch Number', required: true, type: 'string' },
      { key: 'expiry_date', label: 'Expiry Date', required: true, type: 'date' },
      { key: 'requires_prescription', label: 'Prescription Required', required: false, type: 'boolean' }
    ],
    features: ['inventory', 'sales', 'expenses', 'expiry_alerts', 'prescriptions']
  },
  restaurant: {
    label: 'Restaurant / Cafe',
    metadata_fields: [
      { key: 'table_no', label: 'Table Number', required: false, type: 'string' },
      { key: 'is_tax_inclusive', label: 'Tax Inclusive', required: false, type: 'boolean' }
    ],
    features: ['inventory', 'sales', 'expenses', 'kitchen_display', 'table_management']
  },
  hardware: {
    label: 'Hardware Store',
    metadata_fields: [
      { key: 'location_aisle', label: 'Aisle Location', required: false, type: 'string' }
    ],
    features: ['inventory', 'sales', 'expenses', 'wholesale_pricing']
  }
};

/**
 * Validate Metadata for a specific category
 */
const validateCategoryMetadata = (category, metadata = {}) => {
  const profile = CATEGORY_PROFILES[category] || CATEGORY_PROFILES.retail;
  const errors = [];

  profile.metadata_fields.forEach(field => {
    if (field.required && !metadata[field.key]) {
      errors.push(`${field.label} is required for ${profile.label}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  CATEGORY_PROFILES,
  validateCategoryMetadata
};
