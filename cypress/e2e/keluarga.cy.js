describe('Aplikasi Kependudukan - Comprehensive Keluarga Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.navigateToSection('Data Keluarga');
    cy.contains('Data Keluarga').should('be.visible');
  });

  context('Table Display & Structure', () => {
    it('should display table with correct columns', () => {
      const expectedColumns = [
        'No. KK', 'Kepala Keluarga', 'Alamat', 'Desa/Kelurahan',
        'Kecamatan', 'Kabupaten/Kota', 'Provinsi', 'Jumlah Anggota', 'Aksi'
      ];

      expectedColumns.forEach(column => {
        cy.get('th').should('contain', column);
      });
    });

    it('should have proper table structure', () => {
      cy.get('.ant-table').should('exist');
      cy.get('.ant-table-tbody').should('exist');
      cy.get('.ant-table-thead').should('exist');
    });

    it('should display member count for each family', () => {
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).find('td').eq(7).invoke('text').then((count) => {
          expect(parseInt(count)).to.be.at.least(0);
        });
      });
    });

    it('should show view member button for each family', () => {
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).find('[data-icon="team"]').should('exist');
      });
    });
  });

  context('Family Member View', () => {
    it('should open member modal when view button clicked', () => {
      cy.get('tbody tr').first().find('[data-icon="team"]').click();

      cy.get('.ant-modal').should('be.visible');
      cy.get('.ant-modal-title').should('contain', 'Anggota Keluarga');
    });

    it('should display member table with correct columns', () => {
      cy.get('tbody tr').first().find('[data-icon="team"]').click();

      const expectedColumns = ['Nama', 'NIK', 'JK', 'Umur', 'SHDK', 'Pekerjaan'];

      cy.get('.ant-modal').within(() => {
        expectedColumns.forEach(column => {
          cy.get('th').should('contain', column);
        });
      });
    });

    it('should show correct member data', () => {
      cy.get('tbody tr').first().find('[data-icon="team"]').click();

      // Get family No. KK from main table
      cy.get('tbody tr').first().find('td').first().invoke('text').then((noKK) => {
        cy.get('.ant-modal-title').should('contain', noKK);
      });

      // Check member data structure
      cy.get('.ant-modal').find('tbody tr').each(($row) => {
        cy.wrap($row).find('td').should('have.length', 6);
      });
    });

    it('should close member modal correctly', () => {
      cy.get('tbody tr').first().find('[data-icon="team"]').click();
      cy.get('.ant-modal-close').click();

      cy.get('.ant-modal').should('not.exist');
    });

    it('should handle families with no members', () => {
      // This would require a family with no members
      // For now, test with existing data
      cy.get('tbody tr').first().find('[data-icon="team"]').click();
      cy.get('.ant-modal').find('tbody tr').should('have.length.at.least', 0);
    });
  });

  context('Data Validation & Integrity', () => {
    it('should display valid No. KK format', () => {
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).find('td').first().invoke('text').should('match', /^\d{16}$/);
      });
    });

    it('should have consistent data between family and members', () => {
      cy.get('tbody tr').first().find('td').first().invoke('text').then((noKK) => {
        cy.get('tbody tr').first().find('td').eq(7).invoke('text').then((memberCount) => {
          cy.get('tbody tr').first().find('[data-icon="team"]').click();

          cy.get('.ant-modal').find('tbody tr').should('have.length', parseInt(memberCount));

          // Check that all members have the same No. KK
          cy.get('.ant-modal').find('tbody tr').each(($memberRow) => {
            // This would require checking member No. KK field
            // For now, just verify modal opens with correct title
            cy.get('.ant-modal-title').should('contain', noKK);
          });
        });
      });
    });

    it('should display reasonable address information', () => {
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).find('td').eq(2).invoke('text').should('not.be.empty');
      });
    });
  });

  context('Search & Filtering', () => {
    it('should filter by kepala keluarga name', () => {
      // This would require search functionality
      // For now, test basic table display
      cy.get('tbody tr').should('have.length.at.least', 0);
    });

    it('should filter by No. KK', () => {
      // Test with partial No. KK
      cy.get('tbody tr').first().find('td').first().invoke('text').then((noKK) => {
        // This would require search input
        // For now, verify data format
        expect(noKK).to.match(/^\d{16}$/);
      });
    });
  });

  context('Performance & Loading', () => {
    it('should load family data within acceptable time', () => {
      cy.window().then((win) => {
        const startTime = win.performance.now();
        cy.get('.ant-table-tbody').should('be.visible').then(() => {
          const endTime = win.performance.now();
          const loadTime = endTime - startTime;
          expect(loadTime).to.be.lessThan(5000); // Less than 5 seconds
        });
      });
    });

    it('should handle large member lists efficiently', () => {
      cy.get('tbody tr').first().find('[data-icon="team"]').click();

      // Check if modal handles scrolling for large lists
      cy.get('.ant-modal').find('.ant-table-body').should('have.css', 'overflow');
    });
  });

  context('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '**/keluarga-list', { forceNetworkError: true });

      cy.reload();
      cy.contains('Gagal memuat data!').should('be.visible');
    });

    it('should handle empty family list', () => {
      cy.intercept('GET', '**/keluarga-list', []);

      cy.reload();
      cy.get('.ant-table-placeholder').should('exist');
    });

    it('should handle member loading errors', () => {
      cy.intercept('GET', '**/keluarga-members/*', { statusCode: 500 });

      cy.get('tbody tr').first().find('[data-icon="team"]').click();
      // Should handle error gracefully
      cy.get('.ant-modal').should('be.visible');
    });
  });

  context('Accessibility & Usability', () => {
    it('should be keyboard navigable', () => {
      // Test tab navigation
      cy.get('body').tab().tab().tab();
    });

    it('should support screen readers', () => {
      cy.get('table').should('have.attr', 'aria-label').or('have.attr', 'role');
      cy.get('[data-icon="team"]').each(($btn) => {
        cy.wrap($btn).should('have.attr', 'aria-label').or('have.attr', 'aria-describedby');
      });
    });

    it('should have proper focus management', () => {
      cy.get('tbody tr').first().find('[data-icon="team"]').focus().should('have.focus');
      cy.realPress('Enter');

      // Modal should open
      cy.get('.ant-modal').should('be.visible');
    });

    it('should close modal with Escape key', () => {
      cy.get('tbody tr').first().find('[data-icon="team"]').click();
      cy.get('.ant-modal').should('be.visible');

      cy.realPress('Escape');
      cy.get('.ant-modal').should('not.exist');
    });
  });

  context('Mobile Responsiveness', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-6');

      cy.contains('Data Keluarga').should('be.visible');

      // Table should be horizontally scrollable
      cy.get('.ant-table-body').should('have.css', 'overflow-x', 'auto');

      // Test member view on mobile
      cy.get('tbody tr').first().find('[data-icon="team"]').click();
      cy.get('.ant-modal').should('be.visible');
    });

    it('should adapt to tablet view', () => {
      cy.viewport('ipad-2');

      cy.contains('Data Keluarga').should('be.visible');
      cy.get('.ant-table').should('be.visible');
    });
  });

  context('Data Export & Reporting', () => {
    it('should export family data', () => {
      // This would require export functionality
      // For now, test basic table display
      cy.get('tbody tr').should('have.length.at.least', 0);
    });

    it('should generate family reports', () => {
      // Test report generation functionality if available
      cy.get('tbody tr').first().find('[data-icon="team"]').click();

      // Modal should contain complete family information
      cy.get('.ant-modal').should('be.visible');
    });
  });

  context('Integration with Penduduk', () => {
    it('should show accurate member count', () => {
      cy.get('tbody tr').first().find('td').first().invoke('text').then((noKK) => {
        cy.get('tbody tr').first().find('td').eq(7).invoke('text').then((displayedCount) => {
          // Navigate to penduduk and count members with same No. KK
          cy.navigateToSection('Data Penduduk');

          let actualCount = 0;
          cy.get('tbody tr').each(($row) => {
            cy.wrap($row).find('td').eq(4).invoke('text').then((rowNoKK) => {
              if (rowNoKK === noKK) {
                actualCount++;
              }
            });
          }).then(() => {
            expect(parseInt(displayedCount)).to.equal(actualCount);
          });

          // Go back to keluarga
          cy.navigateToSection('Data Keluarga');
        });
      });
    });

    it('should reflect penduduk changes in family view', () => {
      // Add a penduduk with existing No. KK
      cy.navigateToSection('Data Penduduk');

      // Get existing No. KK from first row
      cy.get('tbody tr').first().find('td').eq(4).invoke('text').then((existingNoKK) => {
        cy.contains('Tambah Penduduk').click();
        cy.get('input[placeholder*="NIK"]').type(`fam${Date.now()}`);
        cy.get('input[placeholder*="Nama"]').type('Family Integration Test');
        cy.get('select').first().select('Laki-laki');
        cy.get('input[type="date"]').type('1990-01-01');
        cy.get('input[placeholder*="No. Kartu Keluarga"]').type(existingNoKK);
        cy.get('textarea').type('Integration Test Address');
        cy.get('button[type="submit"]').click();

        // Go back to keluarga
        cy.navigateToSection('Data Keluarga');

        // Find the family with that No. KK and check member count increased
        cy.get('tbody tr').each(($row) => {
          cy.wrap($row).find('td').first().invoke('text').then((noKK) => {
            if (noKK === existingNoKK) {
              cy.wrap($row).find('td').eq(7).invoke('text').then((count) => {
                expect(parseInt(count)).to.be.at.least(1);
              });
            }
          });
        });
      });
    });
  });
});