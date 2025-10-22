describe('Bulk import E2E', () => {
  it('pastes markdown, previews, edits and imports', () => {
    cy.visit('/bulk-import');

    const md = '- [ ] E2E task example | priority:high\n- [ ] Another task';

    // Paste into textarea
    cy.get('textarea[aria-label="Bulk markdown input"]').clear().type(md, { delay: 10 });

    // Click Preview
    cy.contains('button', 'Preview').click();

    // Wait for grid to populate
    cy.get('table').should('exist');

    // Edit first row title
    cy.get('input[aria-label="Title row 1"]').clear().type('E2E task example - edited');

    // Click Save to DB
    cy.contains('button', 'Save to DB').click();

    // After import, navigate to Tasks page and assert task exists
    cy.visit('/tasks');
    cy.contains('E2E task example - edited').should('exist');
  });
});
