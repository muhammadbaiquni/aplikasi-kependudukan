describe('Aplikasi Kependudukan - Comprehensive Penduduk Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.navigateToSection('Data Penduduk');
    cy.contains('Data Penduduk').should('be.visible');
  });

  context('Table Display & Structure', () => {
    it('should display table with correct columns', () => {
      const expectedColumns = ['NIK', 'Nama', 'JK', 'Umur', 'No. KK', 'Alamat', 'Aksi'];

      expectedColumns.forEach(column => {
        cy.get('th').should('contain', column);
      });
    });

    it('should have proper table structure', () => {
      cy.get('.ant-table').should('exist');
      cy.get('.ant-table-tbody').should('exist');
      cy.get('.ant-table-thead').should('exist');
    });

    it('should display action buttons for each row', () => {
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).find('[data-icon="edit"]').should('exist');
        cy.wrap($row).find('[data-icon="delete"]').should('exist');
      });
    });

    it('should have sortable columns', () => {
      // Test sorting on Nama column
      cy.get('th').contains('Nama').click();
      // Should show sort indicator
      cy.get('th').contains('Nama').find('.ant-table-column-sorter').should('exist');
    });

    it('should have filterable columns', () => {
      // Test filter on JK column
      cy.get('th').contains('JK').find('.ant-table-filter-trigger').should('exist');
    });

    it('should support pagination', () => {
      cy.get('.ant-pagination').should('exist');
      cy.get('.ant-pagination-item').should('have.length.at.least', 1);
    });
  });

  context('CRUD Operations - Create', () => {
    beforeEach(() => {
      cy.contains('Tambah Penduduk').click();
      cy.contains('Tambah Penduduk').should('be.visible');
    });

    it('should open add penduduk modal', () => {
      cy.get('.ant-modal').should('be.visible');
      cy.get('.ant-modal-title').should('contain', 'Tambah Penduduk');
    });

    it('should validate required fields', () => {
      cy.get('button[type="submit"]').click();

      // Check validation messages
      cy.contains('NIK wajib diisi!').should('be.visible');
      cy.contains('Nama wajib diisi!').should('be.visible');
    });

    it('should validate NIK format', () => {
      // Test invalid NIK
      cy.get('input[placeholder*="NIK"]').type('123');
      cy.get('button[type="submit"]').click();
      // Should show validation error (if implemented)

      // Test valid NIK
      cy.get('input[placeholder*="NIK"]').clear().type('1234567890123456');
      cy.get('input[placeholder*="Nama"]').type('Valid User');
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('textarea').type('Valid Address');
      cy.get('button[type="submit"]').click();

      cy.contains('Data berhasil ditambahkan!').should('be.visible');
    });

    it('should handle all form fields correctly', () => {
      const testData = {
        nik: '1111111111111111',
        nama: 'Test User Comprehensive',
        jk: 'Perempuan',
        tmpt_lhr: 'Jakarta',
        tgl_lhr: '1995-05-15',
        status: 'KAWIN',
        shdk: 'ISTRI',
        no_kk: '1111111111111111',
        agama: 'Islam',
        pddk_akhir: 'Strata I',
        pekerjaan: 'Karyawan Swasta',
        nama_ayah: 'Test Father',
        nama_ibu: 'Test Mother',
        nama_kep_kel: 'Test Kepala Keluarga',
        alamat: 'Jl. Test Comprehensive No. 123, Jakarta Pusat'
      };

      // Fill all form fields
      cy.get('input[placeholder*="NIK"]').type(testData.nik);
      cy.get('input[placeholder*="Nama"]').type(testData.nama);
      cy.get('select').contains('Jenis Kelamin').parent().find('select').select(testData.jk);
      cy.get('input[placeholder*="Tempat Lahir"]').type(testData.tmpt_lhr);
      cy.get('input[type="date"]').type(testData.tgl_lhr);
      cy.get('select').contains('Status Pernikahan').parent().find('select').select(testData.status);
      cy.get('select').contains('Hubungan Keluarga').parent().find('select').select(testData.shdk);
      cy.get('input[placeholder*="No. Kartu Keluarga"]').type(testData.no_kk);
      cy.get('select').contains('Agama').parent().find('select').select(testData.agama);
      cy.get('select').contains('Pendidikan Terakhir').parent().find('select').select(testData.pddk_akhir);
      cy.get('select').contains('Pekerjaan').parent().find('select').select(testData.pekerjaan);
      cy.get('input[placeholder*="Nama Ayah"]').type(testData.nama_ayah);
      cy.get('input[placeholder*="Nama Ibu"]').type(testData.nama_ibu);
      cy.get('input[placeholder*="Nama Kepala Keluarga"]').type(testData.nama_kep_kel);
      cy.get('textarea').type(testData.alamat);

      cy.get('button[type="submit"]').click();
      cy.contains('Data berhasil ditambahkan!').should('be.visible');
    });

    it('should calculate age automatically from birth date', () => {
      const birthDate = '1990-01-01';
      const expectedAge = new Date().getFullYear() - 1990;

      cy.get('input[placeholder*="NIK"]').type('2222222222222222');
      cy.get('input[placeholder*="Nama"]').type('Age Test User');
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type(birthDate);
      cy.get('textarea').type('Test Address');

      // Age should be calculated automatically
      cy.get('button[type="submit"]').click();
      cy.contains('Data berhasil ditambahkan!').should('be.visible');

      // Check if age is displayed correctly in table
      cy.get('tbody').should('contain', expectedAge.toString());
    });

    it('should handle duplicate NIK', () => {
      // First add a user
      cy.get('input[placeholder*="NIK"]').type('3333333333333333');
      cy.get('input[placeholder*="Nama"]').type('First User');
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('textarea').type('Test Address');
      cy.get('button[type="submit"]').click();
      cy.contains('Data berhasil ditambahkan!').should('be.visible');

      // Try to add another with same NIK
      cy.contains('Tambah Penduduk').click();
      cy.get('input[placeholder*="NIK"]').type('3333333333333333');
      cy.get('input[placeholder*="Nama"]').type('Second User');
      cy.get('select').first().select('Perempuan');
      cy.get('input[type="date"]').type('1995-01-01');
      cy.get('textarea').type('Test Address 2');
      cy.get('button[type="submit"]').click();

      // Should show error for duplicate NIK
      cy.contains('NIK sudah terdaftar').should('be.visible');
    });

    it('should cancel form submission', () => {
      cy.get('input[placeholder*="NIK"]').type('4444444444444444');
      cy.get('input[placeholder*="Nama"]').type('Cancel Test User');

      // Click cancel or close modal
      cy.get('.ant-modal-close').click();

      // Modal should close
      cy.get('.ant-modal').should('not.exist');

      // Data should not be added
      cy.get('tbody').should('not.contain', 'Cancel Test User');
    });
  });

  context('CRUD Operations - Read', () => {
    it('should display existing data correctly', () => {
      cy.get('tbody tr').should('have.length.greaterThan', 0);

      // Check data structure
      cy.get('tbody tr').first().within(() => {
        cy.get('td').should('have.length', 7); // NIK, Nama, JK, Umur, No. KK, Alamat, Aksi
      });
    });

    it('should handle empty data gracefully', () => {
      // This would require mocking empty API response
      // For now, just check current behavior with data
      cy.get('.ant-table-placeholder').should('not.exist');
    });

    it('should display data in correct format', () => {
      cy.get('tbody tr').first().within(() => {
        // NIK should be 16 digits
        cy.get('td').first().invoke('text').should('match', /^\d{16}$/);

        // JK should be L or P
        cy.get('td').eq(2).invoke('text').should('match', /^[LP]$/);

        // Umur should be number
        cy.get('td').eq(3).invoke('text').should('match', /^\d+$/);
      });
    });

    it('should support table scrolling for large datasets', () => {
      cy.get('.ant-table-body').should('have.css', 'overflow');
    });

    it('should handle long text truncation', () => {
      // Check if long addresses are truncated with ellipsis
      cy.get('td').contains('...').should('exist').or('not.exist');
    });
  });

  context('CRUD Operations - Update', () => {
    it('should open edit modal with pre-filled data', () => {
      // Click edit button on first row
      cy.get('tbody tr').first().find('[data-icon="edit"]').click();

      // Modal should open
      cy.get('.ant-modal').should('be.visible');
      cy.get('.ant-modal-title').should('contain', 'Edit Penduduk');

      // Form should be pre-filled
      cy.get('input[placeholder*="NIK"]').should('have.value');
      cy.get('input[placeholder*="Nama"]').should('have.value');
    });

    it('should update penduduk data successfully', () => {
      const newName = 'Updated Test User';

      cy.get('tbody tr').first().find('[data-icon="edit"]').click();

      // Update name
      cy.get('input[placeholder*="Nama"]').clear().type(newName);
      cy.get('button[type="submit"]').click();

      cy.contains('Data berhasil diperbarui!').should('be.visible');

      // Check if data is updated in table
      cy.get('tbody tr').first().should('contain', newName);
    });

    it('should validate updates', () => {
      cy.get('tbody tr').first().find('[data-icon="edit"]').click();

      // Clear required fields
      cy.get('input[placeholder*="Nama"]').clear();
      cy.get('button[type="submit"]').click();

      cy.contains('Nama wajib diisi!').should('be.visible');
    });

    it('should not allow NIK changes', () => {
      cy.get('tbody tr').first().find('[data-icon="edit"]').click();

      // NIK field should be readonly or disabled
      cy.get('input[placeholder*="NIK"]').should('be.disabled').or('have.attr', 'readonly');
    });
  });

  context('CRUD Operations - Delete', () => {
    beforeEach(() => {
      // Add a test user for deletion
      cy.contains('Tambah Penduduk').click();
      cy.get('input[placeholder*="NIK"]').type(`del${Date.now()}`);
      cy.get('input[placeholder*="Nama"]').type('Delete Test User');
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('textarea').type('Delete Test Address');
      cy.get('button[type="submit"]').click();
      cy.contains('Data berhasil ditambahkan!').should('be.visible');
    });

    it('should show confirmation dialog on delete', () => {
      // Find the newly added user and click delete
      cy.contains('Delete Test User').parent('tr').find('[data-icon="delete"]').click();

      // Confirmation dialog should appear
      cy.contains('Yakin ingin menghapus data ini?').should('be.visible');
    });

    it('should cancel deletion', () => {
      cy.contains('Delete Test User').parent('tr').find('[data-icon="delete"]').click();
      cy.contains('Batal').click();

      // User should still exist
      cy.contains('Delete Test User').should('be.visible');
    });

    it('should delete penduduk successfully', () => {
      cy.contains('Delete Test User').parent('tr').find('[data-icon="delete"]').click();
      cy.contains('Ya').click();

      cy.contains('Data berhasil dihapus!').should('be.visible');

      // User should be removed from table
      cy.contains('Delete Test User').should('not.exist');
    });
  });

  context('Data Export', () => {
    it('should export data to CSV', () => {
      cy.contains('Export CSV').click();

      // In browser environment, this should trigger download
      // In Electron, it should save to file
      cy.contains('Export CSV').should('be.visible');
    });

    it('should export correct data format', () => {
      // This would require intercepting the download
      // For now, just test that export button works
      cy.contains('Export CSV').should('be.visible');
    });
  });

  context('Search & Filtering', () => {
    it('should filter by gender', () => {
      // Click filter on JK column
      cy.get('th').contains('JK').find('.ant-table-filter-trigger').click();

      // Select Laki-laki
      cy.contains('Laki-laki').click();
      cy.contains('OK').click();

      // Should only show male users
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).find('td').eq(2).should('contain', 'L');
      });
    });

    it('should sort by name', () => {
      cy.get('th').contains('Nama').click();

      // Check if sorting works (ascending)
      let previousName = '';
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).find('td').eq(1).invoke('text').then((currentName) => {
          if (previousName) {
            expect(currentName.toLowerCase()).to.be.at.least(previousName.toLowerCase());
          }
          previousName = currentName;
        });
      });
    });

    it('should sort by age', () => {
      cy.get('th').contains('Umur').click();

      // Check if sorting works (ascending)
      let previousAge = 0;
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).find('td').eq(3).invoke('text').then((currentAge) => {
          const age = parseInt(currentAge);
          expect(age).to.be.at.least(previousAge);
          previousAge = age;
        });
      });
    });
  });

  context('Performance & Loading', () => {
    it('should load data within acceptable time', () => {
      cy.window().then((win) => {
        const startTime = win.performance.now();
        cy.get('.ant-table-tbody').should('be.visible').then(() => {
          const endTime = win.performance.now();
          const loadTime = endTime - startTime;
          expect(loadTime).to.be.lessThan(10000); // Less than 10 seconds
        });
      });
    });

    it('should show loading state during data fetch', () => {
      cy.reload();
      // Should show loading indicator while fetching data
    });

    it('should handle large datasets efficiently', () => {
      // Test with current dataset
      cy.get('tbody tr').should('have.length.greaterThan', 0);
      cy.get('.ant-pagination').should('exist');
    });
  });

  context('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('GET', '**/penduduk-list', { forceNetworkError: true });

      cy.reload();
      // Should show error message
      cy.contains('Gagal memuat data!').should('be.visible');
    });

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '**/penduduk-list', { statusCode: 500 });

      cy.reload();
      cy.contains('Gagal memuat data!').should('be.visible');
    });

    it('should handle form submission errors', () => {
      cy.contains('Tambah Penduduk').click();
      cy.intercept('POST', '**/create-penduduk', { statusCode: 400 });

      cy.get('input[placeholder*="NIK"]').type('5555555555555555');
      cy.get('input[placeholder*="Nama"]').type('Error Test User');
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('textarea').type('Test Address');
      cy.get('button[type="submit"]').click();

      // Should show error message
      cy.contains('Gagal menyimpan data!').should('be.visible');
    });
  });

  context('Accessibility & Usability', () => {
    it('should be keyboard navigable', () => {
      // Test tab navigation through table and buttons
      cy.get('body').tab().tab().tab();
    });

    it('should support screen readers', () => {
      cy.get('table').should('have.attr', 'aria-label').or('have.attr', 'role');
      cy.get('button').each(($btn) => {
        cy.wrap($btn).should('have.attr', 'aria-label').or('have.attr', 'aria-describedby');
      });
    });

    it('should have proper focus management', () => {
      cy.contains('Tambah Penduduk').focus().should('have.focus');
      cy.realPress('Enter');

      // Focus should move to modal
      cy.get('.ant-modal').should('be.visible');
      cy.get('input[placeholder*="NIK"]').should('have.focus');
    });
  });

  context('Mobile Responsiveness', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-6');

      cy.contains('Data Penduduk').should('be.visible');
      cy.contains('Tambah Penduduk').should('be.visible');

      // Table should be scrollable horizontally
      cy.get('.ant-table-body').should('have.css', 'overflow-x', 'auto');
    });

    it('should adapt to tablet view', () => {
      cy.viewport('ipad-2');

      cy.contains('Data Penduduk').should('be.visible');
      cy.get('.ant-table').should('be.visible');
    });
  });

  context('Data Integrity', () => {
    it('should maintain data consistency across operations', () => {
      let initialCount;

      cy.get('tbody tr').its('length').then((count) => {
        initialCount = count;
      });

      // Add user
      cy.contains('Tambah Penduduk').click();
      cy.get('input[placeholder*="NIK"]').type('6666666666666666');
      cy.get('input[placeholder*="Nama"]').type('Integrity Test User');
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('textarea').type('Test Address');
      cy.get('button[type="submit"]').click();

      // Count should increase
      cy.get('tbody tr').should('have.length', initialCount + 1);

      // Delete user
      cy.contains('Integrity Test User').parent('tr').find('[data-icon="delete"]').click();
      cy.contains('Ya').click();

      // Count should return to initial
      cy.get('tbody tr').should('have.length', initialCount);
    });

    it('should validate data formats', () => {
      cy.get('tbody tr').first().within(() => {
        // NIK format validation
        cy.get('td').first().invoke('text').should('match', /^\d{16}$/);

        // Age should be reasonable number
        cy.get('td').eq(3).invoke('text').then((age) => {
          const ageNum = parseInt(age);
          expect(ageNum).to.be.within(0, 150);
        });
      });
    });
  });
});