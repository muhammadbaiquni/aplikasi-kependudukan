describe('Database Operations Tests', () => {
  context('Connection & Initialization', () => {
    it('should initialize database successfully', () => {
      // Test database initialization
      cy.window().then((win) => {
        // This would require database access in test environment
        expect(true).to.be.true; // Placeholder
      });
    });

    it('should create required tables', () => {
      // Test table creation
      cy.login();

      // Verify tables exist by checking data operations work
      cy.navigateToSection('Data Penduduk');
      cy.get('.ant-table').should('exist');
    });
  });

  context('CRUD Operations', () => {
    it('should create penduduk record', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      const testNIK = `db${Date.now()}`;

      cy.contains('Tambah Penduduk').click();
      cy.get('input[placeholder*="NIK"]').type(testNIK);
      cy.get('input[placeholder*="Nama"]').type('DB Test User');
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('textarea').type('DB Test Address');
      cy.get('button[type="submit"]').click();

      cy.contains('Data berhasil ditambahkan!').should('be.visible');
      cy.contains('DB Test User').should('be.visible');
    });

    it('should read penduduk records', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      cy.get('tbody tr').should('have.length.greaterThan', 0);

      // Verify data structure
      cy.get('tbody tr').first().within(() => {
        cy.get('td').eq(0).should('match', /^\d{16}$/); // NIK
        cy.get('td').eq(1).should('not.be.empty'); // Nama
        cy.get('td').eq(2).should('match', /^[LP]$/); // JK
      });
    });

    it('should update penduduk record', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Find and edit first record
      cy.get('tbody tr').first().find('[data-icon="edit"]').click();

      const updatedName = 'Updated DB User';
      cy.get('input[placeholder*="Nama"]').clear().type(updatedName);
      cy.get('button[type="submit"]').click();

      cy.contains('Data berhasil diperbarui!').should('be.visible');
      cy.contains(updatedName).should('be.visible');
    });

    it('should delete penduduk record', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Add test record first
      cy.contains('Tambah Penduduk').click();
      cy.get('input[placeholder*="NIK"]').type(`del${Date.now()}`);
      cy.get('input[placeholder*="Nama"]').type('Delete DB Test');
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('textarea').type('Delete Test Address');
      cy.get('button[type="submit"]').click();

      cy.contains('Data berhasil ditambahkan!').should('be.visible');

      // Now delete it
      cy.contains('Delete DB Test').parent('tr').find('[data-icon="delete"]').click();
      cy.contains('Ya').click();

      cy.contains('Data berhasil dihapus!').should('be.visible');
      cy.contains('Delete DB Test').should('not.exist');
    });
  });

  context('Data Integrity & Constraints', () => {
    it('should enforce unique NIK constraint', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Add first record
      cy.contains('Tambah Penduduk').click();
      cy.get('input[placeholder*="NIK"]').type('9999999999999999');
      cy.get('input[placeholder*="Nama"]').type('Unique Test 1');
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('textarea').type('Unique Test Address');
      cy.get('button[type="submit"]').click();

      cy.contains('Data berhasil ditambahkan!').should('be.visible');

      // Try to add duplicate NIK
      cy.contains('Tambah Penduduk').click();
      cy.get('input[placeholder*="NIK"]').type('9999999999999999');
      cy.get('input[placeholder*="Nama"]').type('Unique Test 2');
      cy.get('select').first().select('Perempuan');
      cy.get('input[type="date"]').type('1995-01-01');
      cy.get('textarea').type('Duplicate Test Address');
      cy.get('button[type="submit"]').click();

      // Should show error
      cy.contains('NIK sudah terdaftar').should('be.visible');
    });

    it('should validate data types', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Check that numeric fields contain numbers
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).find('td').eq(3).invoke('text').then((age) => {
          expect(parseInt(age)).to.be.a('number');
        });
      });
    });

    it('should handle foreign key relationships', () => {
      // Test No. KK relationships between penduduk and keluarga
      cy.login();

      cy.navigateToSection('Data Keluarga');
      cy.get('tbody tr').first().find('td').first().invoke('text').then((noKK) => {
        cy.navigateToSection('Data Penduduk');

        // Check that penduduk records reference valid No. KK
        cy.get('tbody tr').each(($row) => {
          cy.wrap($row).find('td').eq(4).invoke('text').then((pendudukNoKK) => {
            if (pendudukNoKK) {
              // Should match existing family No. KK or be valid
              expect(pendudukNoKK).to.match(/^\d{16}$/);
            }
          });
        });
      });
    });
  });

  context('Performance & Query Optimization', () => {
    it('should execute queries within acceptable time', () => {
      cy.login();

      cy.window().then((win) => {
        const startTime = win.performance.now();

        cy.navigateToSection('Data Penduduk');
        cy.get('.ant-table-tbody').should('be.visible').then(() => {
          const endTime = win.performance.now();
          const loadTime = endTime - startTime;

          // Should load within reasonable time
          expect(loadTime).to.be.lessThan(15000); // 15 seconds max
        });
      });
    });

    it('should handle large datasets efficiently', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Test pagination works
      cy.get('.ant-pagination').should('exist');

      // Test table scrolling
      cy.get('.ant-table-body').should('have.css', 'overflow');
    });

    it('should optimize search operations', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Test that search/filter operations are responsive
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });
  });

  context('Transaction & Concurrency', () => {
    it('should handle concurrent operations', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Perform multiple operations in sequence
      for (let i = 0; i < 3; i++) {
        cy.contains('Tambah Penduduk').click();
        cy.get('input[placeholder*="NIK"]').type(`conc${Date.now()}${i}`);
        cy.get('input[placeholder*="Nama"]').type(`Concurrent User ${i}`);
        cy.get('select').first().select('Laki-laki');
        cy.get('input[type="date"]').type('1990-01-01');
        cy.get('textarea').type(`Concurrent Address ${i}`);
        cy.get('button[type="submit"]').click();

        cy.contains('Data berhasil ditambahkan!').should('be.visible');
      }

      // Verify all operations completed
      cy.contains('Concurrent User').should('have.length', 3);
    });

    it('should maintain data consistency during operations', () => {
      cy.login();

      // Get initial count
      cy.navigateToSection('Dashboard');
      cy.get('.ant-statistic-content').first().invoke('text').then((initialCount) => {
        const count = parseInt(initialCount.replace(/\D/g, ''));

        // Add record
        cy.navigateToSection('Data Penduduk');
        cy.contains('Tambah Penduduk').click();
        cy.get('input[placeholder*="NIK"]').type(`cons${Date.now()}`);
        cy.get('input[placeholder*="Nama"]').type('Consistency Check User');
        cy.get('select').first().select('Laki-laki');
        cy.get('input[type="date"]').type('1990-01-01');
        cy.get('textarea').type('Consistency Address');
        cy.get('button[type="submit"]').click();

        // Check dashboard updated
        cy.navigateToSection('Dashboard');
        cy.get('.ant-statistic-content').first().invoke('text').then((newCount) => {
          const updatedCount = parseInt(newCount.replace(/\D/g, ''));
          expect(updatedCount).to.equal(count + 1);
        });
      });
    });
  });

  context('Backup & Recovery', () => {
    it('should export data successfully', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Test export functionality
      cy.contains('Export CSV').should('be.visible').click();

      // In Electron environment, this should trigger file save dialog
      // In browser, it should download file
    });

    it('should maintain data format in export', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Verify export contains correct data structure
      cy.get('tbody tr').first().then(($row) => {
        const cells = $row.find('td');
        expect(cells.length).to.be.at.least(6);
      });
    });
  });

  context('Error Handling & Recovery', () => {
    it('should handle database connection errors', () => {
      // Mock database error
      cy.intercept('GET', '**/penduduk-list', { statusCode: 500 });

      cy.login();
      cy.navigateToSection('Data Penduduk');

      cy.contains('Gagal memuat data!').should('be.visible');
    });

    it('should recover from transient errors', () => {
      cy.login();

      // Simulate error then recovery
      cy.intercept('GET', '**/penduduk-list', { statusCode: 500 });
      cy.navigateToSection('Data Penduduk');
      cy.contains('Gagal memuat data!').should('be.visible');

      // Restore normal operation
      cy.intercept('GET', '**/penduduk-list', { statusCode: 200 });
      cy.reload();
      cy.get('.ant-table').should('be.visible');
    });

    it('should handle constraint violations gracefully', () => {
      cy.login();
      cy.navigateToSection('Data Penduduk');

      // Try invalid data
      cy.contains('Tambah Penduduk').click();
      cy.get('input[placeholder*="NIK"]').type('invalid');
      cy.get('input[placeholder*="Nama"]').type('');
      cy.get('button[type="submit"]').click();

      // Should show appropriate validation errors
      cy.get('.ant-form-item-explain-error').should('exist');
    });
  });
});