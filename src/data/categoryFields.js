// Defines which extra fields show up in the Admin product form (and on each
// product's page) depending on the selected category. To add, remove, or
// change a field for any category, just edit the arrays below — nothing
// else needs to change.
//
// Each field: { key, label, type, options? }
// type: 'text' (single line), 'select' (dropdown), 'multiselect' (checkboxes),
// 'tags' (free-form tag chips — type a note, press Enter/comma to add it;
// stored as an array of strings, useful later for filtering/suggestions)

export const CATEGORY_FIELDS = {
  perfumes: [
    { key: 'topNotes', label: 'Top notes', type: 'tags' },
    { key: 'heartNotes', label: 'Heart notes', type: 'tags' },
    { key: 'baseNotes', label: 'Base notes', type: 'tags' },
    { key: 'concentration', label: 'Concentration', type: 'select', options: ['EDT', 'EDP', 'Parfum', 'Extrait'] },
    { key: 'lasting', label: 'Lasting power', type: 'select', options: ['Light', 'Moderate', 'Long-lasting', 'Very long-lasting'] },
    { key: 'projection', label: 'Projection', type: 'select', options: ['Intimate', 'Moderate', 'Strong', 'Beast mode'] },
    { key: 'season', label: 'Season', type: 'multiselect', options: ['Spring', 'Summer', 'Fall', 'Winter'] },
    { key: 'occasion', label: 'Occasion', type: 'multiselect', options: ['Casual', 'Office', 'Evening', 'Special'] }
  ],
  attars: [
    { key: 'topNotes', label: 'Top notes', type: 'tags' },
    { key: 'heartNotes', label: 'Heart notes', type: 'tags' },
    { key: 'baseNotes', label: 'Base notes', type: 'tags' }
  ],
  soaps: [
    { key: 'inspiredBy', label: 'Inspired by', type: 'text' }
  ],
  candles: [
    { key: 'inspiredBy', label: 'Inspired by', type: 'text' }
  ]
}
