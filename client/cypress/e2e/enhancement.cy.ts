describe('Location Enhancement System', () => {
  beforeEach(() => {
    cy.visit('/location-enhancements');
  });

  it('should validate location ID format', () => {
    cy.get('[data-testid="location-id-input"]').type('invalid_id');
    cy.get('[data-testid="directory-name-input"]').type('contractors');
    cy.get('[data-testid="save-button"]').should('be.disabled');
    cy.contains('Invalid location ID format').should('be.visible');
  });

  it('should validate directory name format', () => {
    cy.get('[data-testid="location-id-input"]').type('WAvk87RmW9rBSDJHeOpH');
    cy.get('[data-testid="directory-name-input"]').type('Invalid Name!');
    cy.get('[data-testid="save-button"]').should('be.disabled');
    cy.contains('Directory name must be 3-30 lowercase').should('be.visible');
  });

  it('should show loading spinner during save', () => {
    cy.intercept('POST', '/api/location-enhancements', { delay: 1000 }).as('saveEnhancement');
    
    cy.get('[data-testid="location-id-input"]').type('WAvk87RmW9rBSDJHeOpH');
    cy.get('[data-testid="directory-name-input"]').type('contractors');
    cy.get('[data-testid="metadata-bar-toggle"]').click();
    cy.get('[data-testid="save-button"]').click();
    
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    cy.wait('@saveEnhancement');
    cy.contains('Enhancement saved successfully').should('be.visible');
  });

  it('should handle location search and autocomplete', () => {
    cy.intercept('GET', '/api/support/locations*', {
      fixture: 'locations.json'
    }).as('searchLocations');

    cy.get('[data-testid="location-search-input"]').type('Acme');
    cy.wait('@searchLocations');
    cy.get('[data-testid="location-suggestion"]').first().click();
    cy.get('[data-testid="location-id-input"]').should('have.value', 'WAvk87RmW9rBSDJHeOpH');
  });

  it('should show conflict resolution modal', () => {
    cy.intercept('POST', '/api/location-enhancements', {
      statusCode: 409,
      body: {
        conflict: true,
        theirs: {
          enhancementConfig: { metadataBar: { enabled: true } },
          updatedAt: '2023-01-01T12:00:00Z',
          updatedBy: 'Another User'
        },
        yours: {
          enhancementConfig: { metadataBar: { enabled: false } },
          lastModified: '2023-01-01T12:30:00Z'
        }
      }
    }).as('conflictResponse');

    cy.get('[data-testid="location-id-input"]').type('WAvk87RmW9rBSDJHeOpH');
    cy.get('[data-testid="directory-name-input"]').type('contractors');
    cy.get('[data-testid="save-button"]').click();
    
    cy.wait('@conflictResponse');
    cy.get('[data-testid="conflict-modal"]').should('be.visible');
    cy.contains('Configuration Conflict Detected').should('be.visible');
    cy.get('[data-testid="merge-button"]').should('be.visible');
    cy.get('[data-testid="override-button"]').should('be.visible');
  });

  it('should enable bulk enhancement operations', () => {
    cy.intercept('POST', '/api/support/locations/bulk-enhance', {
      body: { success: true, updated: 3, errors: 0 }
    }).as('bulkUpdate');

    cy.get('[data-testid="bulk-mode-toggle"]').click();
    cy.get('[data-testid="location-multiselect"]').click();
    cy.get('[data-testid="location-option"]').eq(0).click();
    cy.get('[data-testid="location-option"]').eq(1).click();
    cy.get('[data-testid="location-option"]').eq(2).click();
    
    cy.get('[data-testid="directory-name-input"]').type('contractors');
    cy.get('[data-testid="metadata-bar-toggle"]').click();
    cy.get('[data-testid="bulk-save-button"]').click();
    
    cy.wait('@bulkUpdate');
    cy.contains('3 locations updated successfully').should('be.visible');
  });
});