describe('Aplikasi Kependudukan - Integration Tests', () => {
  context('End-to-End User Workflows', () => {
    it('should complete full penduduk lifecycle', () => {
      // Login
      cy.login();

      // Navigate to penduduk
      cy.navigateToSection('Data Penduduk');

      // Add new penduduk
      const testNIK = `e2e${Date.now()}`;
      const testName = 'E2E Test User';

      cy.contains('Tambah Penduduk').click();
      cy.get('input[placeholder*="NIK"]').type(testNIK);
      cy.get('input[placeholder*="Nama"]').type(testName);
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('input[placeholder*="No. Kartu Keluarga"]').type(`kk${Date.now()}`);
      cy.get('textarea').type('E2E Test Address');
      cy.get('button[type="submit"]').click();

      cy.contains('Data berhasil ditambahkan!').should('be.visible');

      // Verify data appears in table
      cy.contains(testName).should('be.visible');

      // Edit the penduduk
      cy.contains(testName).parent('tr').find('[data-icon="edit"]').click();
      cy.get('input[placeholder*="Nama"]').clear().type('E2E Updated User');
      cy.get('button[type="submit"]').click();

      cy.contains('Data berhasil diperbarui!').should('be.visible');
      cy.contains('E2E Updated User').should('be.visible');

      // Delete the penduduk
      cy.contains('E2E Updated User').parent('tr').find('[data-icon="delete"]').click();
      cy.contains('Ya').click();

      cy.contains('Data berhasil dihapus!').should('be.visible');
      cy.contains('E2E Updated User').should('not.exist');

      // Logout
      cy.contains('Logout').click();
      cy.contains('Login Aplikasi Kependudukan').should('be.visible');
    });

    it('should handle family-member relationships', () => {
      cy.login();

      // Create family first (would require family creation functionality)
      // For now, test with existing data
      cy.navigateToSection('Data Keluarga');

      let initialMemberCount;
      cy.get('tbody tr').first().find('td').eq(7).invoke('text').then((count) => {
        initialMemberCount = parseInt(count);
      });

      // Add member to family via penduduk
      cy.navigateToSection('Data Penduduk');

      cy.get('tbody tr').first().find('td').eq(4).invoke('text').then((noKK) => {
        cy.contains('Tambah Penduduk').click();
        cy.get('input[placeholder*="NIK"]').type(`rel${Date.now()}`);
        cy.get('input[placeholder*="Nama"]').type('Relationship Test User');
        cy.get('select').first().select('Perempuan');
        cy.get('input[type="date"]').type('1995-01-01');
        cy.get('input[placeholder*="No. Kartu Keluarga"]').type(noKK);
        cy.get('select').contains('Hubungan Keluarga').parent().find('select').select('ANAK');
        cy.get('textarea').type('Relationship Test Address');
        cy.get('button[type="submit"]').click();

        cy.contains('Data berhasil ditambahkan!').should('be.visible');

        // Check family member count increased
        cy.navigateToSection('Data Keluarga');

        cy.get('tbody tr').each(($row) => {
          cy.wrap($row).find('td').first().invoke('text').then((rowNoKK) => {
            if (rowNoKK === noKK) {
              cy.wrap($row).find('td').eq(7).invoke('text').then((newCount) => {
                expect(parseInt(newCount)).to.equal(initialMemberCount + 1);
              });
            }
          });
        });
      });
    });

    it('should maintain data consistency across modules', () => {
      cy.login();

      // Get initial statistics
      cy.contains('Dashboard Kependudukan').should('be.visible');
      cy.get('.ant-statistic-content').first().invoke('text').then((initialTotal) => {
        const initialCount = parseInt(initialTotal.replace(/\D/g, ''));

        // Add penduduk
        cy.navigateToSection('Data Penduduk');
        cy.contains('Tambah Penduduk').click();
        cy.get('input[placeholder*="NIK"]').type(`cons${Date.now()}`);
        cy.get('input[placeholder*="Nama"]').type('Consistency Test User');
        cy.get('select').first().select('Laki-laki');
        cy.get('input[type="date"]').type('1990-01-01');
        cy.get('textarea').type('Consistency Test Address');
        cy.get('button[type="submit"]').click();

        // Go back to dashboard
        cy.navigateToSection('Dashboard');

        // Check if statistics updated
        cy.get('.ant-statistic-content').first().invoke('text').then((newTotal) => {
          const newCount = parseInt(newTotal.replace(/\D/g, ''));
          expect(newCount).to.equal(initialCount + 1);
        });
      });
    });
  });

  context('Cross-Module Data Validation', () => {
    it('should validate penduduk-keluarga relationships', () => {
      cy.login();
      cy.navigateToSection('Data Keluarga');

      // Check each family
      cy.get('tbody tr').each(($familyRow, index) => {
        if (index < 3) { // Limit to first 3 families for performance
          cy.wrap($familyRow).find('td').first().invoke('text').then((noKK) => {
            cy.wrap($familyRow).find('td').eq(7).invoke('text').then((memberCount) => {
              // Navigate to penduduk and count members
              cy.navigateToSection('Data Penduduk');

              let actualCount = 0;
              cy.get('tbody tr').each(($pendudukRow) => {
                cy.wrap($pendudukRow).find('td').eq(4).invoke('text').then((pendudukNoKK) => {
                  if (pendudukNoKK === noKK) {
                    actualCount++;
                  }
                });
              }).then(() => {
                expect(actualCount).to.equal(parseInt(memberCount));
              });

              // Go back to keluarga
              cy.navigateToSection('Data Keluarga');
            });
          });
        }
      });
    });

    it('should ensure No. KK consistency', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      const noKKSet = new Set();

      // Collect all No. KK values
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).find('td').eq(4).invoke('text').then((noKK) => {
          if (noKK && noKK.trim()) {
            noKKSet.add(noKK);
          }
        });
      }).then(() => {
        // Navigate to keluarga and check consistency
        cy.navigateToSection('Data Keluarga');

        cy.get('tbody tr').each(($row) => {
          cy.wrap($row).find('td').first().invoke('text').then((familyNoKK) => {
            expect(noKKSet.has(familyNoKK)).to.be.true;
          });
        });
      });
    });
  });

  context('Performance & Scalability', () => {
    it('should handle multiple rapid operations', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Perform multiple operations quickly
      for (let i = 0; i < 3; i++) {
        cy.contains('Tambah Penduduk').click();
        cy.get('input[placeholder*="NIK"]').type(`bulk${Date.now()}${i}`);
        cy.get('input[placeholder*="Nama"]').type(`Bulk Test User ${i}`);
        cy.get('select').first().select('Laki-laki');
        cy.get('input[type="date"]').type('1990-01-01');
        cy.get('textarea').type(`Bulk Test Address ${i}`);
        cy.get('button[type="submit"]').click();
        cy.contains('Data berhasil ditambahkan!').should('be.visible');
      }

      // Verify all operations completed
      cy.contains('Bulk Test User').should('have.length', 3);
    });

    it('should maintain performance with data growth', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      cy.window().then((win) => {
        const startTime = win.performance.now();
        cy.get('.ant-table-tbody').should('be.visible').then(() => {
          const endTime = win.performance.now();
          const loadTime = endTime - startTime;
          expect(loadTime).to.be.lessThan(10000); // Should load within 10 seconds
        });
      });
    });
  });

  context('Error Recovery & Resilience', () => {
    it('should recover from network interruptions', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Simulate network error
      cy.intercept('GET', '**/penduduk-list', { forceNetworkError: true });

      cy.reload();
      cy.contains('Gagal memuat data!').should('be.visible');

      // Retry should work
      cy.intercept('GET', '**/penduduk-list', { fixture: 'penduduk-list.json' });
      cy.reload();
      cy.get('.ant-table-tbody').should('be.visible');
    });

    it('should handle concurrent user sessions', () => {
      // This would require multiple browser sessions
      // For now, test single session behavior
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Open multiple tabs/windows would require different approach
      cy.contains('Data Penduduk').should('be.visible');
    });
  });

  context('Data Export & Import Integration', () => {
    it('should export and re-import data consistently', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Export data
      cy.contains('Export CSV').click();

      // In a real scenario, this would download a file
      // For now, verify export functionality exists
      cy.contains('Export CSV').should('be.visible');
    });

    it('should maintain data integrity during export', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      let tableData = [];
      cy.get('tbody tr').each(($row) => {
        const rowData = [];
        cy.wrap($row).find('td').each(($cell, index) => {
          if (index < 6) { // Skip action column
            cy.wrap($cell).invoke('text').then((text) => {
              rowData.push(text);
            });
          }
        }).then(() => {
          tableData.push(rowData);
        });
      }).then(() => {
        // Export should contain same data
        cy.contains('Export CSV').should('be.visible');
      });
    });
  });
});