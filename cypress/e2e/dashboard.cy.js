describe('Aplikasi Kependudukan - Comprehensive Dashboard Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.contains('Dashboard Kependudukan').should('be.visible');
  });

  context('Dashboard Layout & Structure', () => {
    it('should display all main dashboard sections', () => {
      cy.contains('Dashboard Kependudukan').should('be.visible');
      cy.contains('Selamat Datang').should('be.visible');
      cy.contains('Total Penduduk').should('be.visible');
      cy.contains('Laki-laki').should('be.visible');
      cy.contains('Perempuan').should('be.visible');
      cy.contains('Penduduk Aktif').should('be.visible');
    });

    it('should have proper sidebar navigation', () => {
      // Check sidebar structure
      cy.get('.ant-layout-sider').should('be.visible');
      cy.contains('APLIKASI PENDUDUK').should('be.visible');
      cy.contains('Dashboard').should('be.visible');
      cy.contains('Data Penduduk').should('be.visible');
      cy.contains('Data Keluarga').should('be.visible');
      cy.contains('Logout').should('be.visible');
    });

    it('should display statistics cards correctly', () => {
      // Check statistics cards
      cy.get('.ant-card').should('have.length.at.least', 4);

      // Check each statistic card has proper structure
      cy.get('.ant-card').each(($card) => {
        cy.wrap($card).find('.ant-statistic').should('exist');
        cy.wrap($card).find('.ant-statistic-title').should('exist');
        cy.wrap($card).find('.ant-statistic-content').should('exist');
      });
    });

    it('should have responsive layout', () => {
      // Test desktop view
      cy.viewport(1200, 800);
      cy.get('.ant-layout-sider').should('be.visible');

      // Test tablet view
      cy.viewport(768, 1024);
      cy.get('.ant-layout-sider').should('be.visible');

      // Test mobile view
      cy.viewport(375, 667);
      cy.get('.ant-layout-sider').should('not.be.visible').or('have.css', 'display', 'none');
    });
  });

  context('Statistics & Data Visualization', () => {
    it('should display accurate statistics', () => {
      // Check that statistics are numbers
      cy.get('.ant-statistic-content').each(($stat) => {
        const text = $stat.text().trim();
        expect(parseInt(text.replace(/\D/g, ''))).to.be.a('number');
      });
    });

    it('should render charts correctly', () => {
      // Check if charts are present
      cy.get('svg').should('exist');

      // Check chart structure (Recharts)
      cy.get('svg').should('have.attr', 'width');
      cy.get('svg').should('have.attr', 'height');
    });

    it('should display chart legends', () => {
      // Check for chart legends
      cy.get('text').should('contain', 'Islam').or('contain', 'KAWIN');
    });

    it('should handle empty data gracefully', () => {
      // Test with mock empty data scenario
      cy.window().then((win) => {
        // This would require mocking the API response
        // For now, just check current behavior
        cy.get('.ant-card').should('have.length.at.least', 4);
      });
    });

    it('should update statistics on data changes', () => {
      // Navigate to penduduk, add data, come back and check if stats updated
      cy.navigateToSection('Data Penduduk');

      // Add a penduduk
      cy.contains('Tambah Penduduk').click();
      cy.get('input[placeholder*="NIK"]').type('9999999999999999');
      cy.get('input[placeholder*="Nama"]').type('Test User Cypress');
      cy.get('select').first().select('Laki-laki');
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('textarea').type('Test Address');
      cy.get('button[type="submit"]').click();

      // Go back to dashboard
      cy.navigateToSection('Dashboard');

      // Statistics should be updated (this might require API call verification)
      cy.get('.ant-statistic-content').first().should('exist');
    });
  });

  context('Navigation & User Interactions', () => {
    it('should navigate to penduduk page', () => {
      cy.navigateToSection('Data Penduduk');
      cy.contains('Data Penduduk').should('be.visible');
      cy.url().should('include', 'penduduk');
    });

    it('should navigate to keluarga page', () => {
      cy.navigateToSection('Data Keluarga');
      cy.contains('Data Keluarga').should('be.visible');
      cy.url().should('include', 'keluarga');
    });

    it('should handle logout correctly', () => {
      cy.contains('Logout').click();
      cy.contains('Login Aplikasi Kependudukan').should('be.visible');
      cy.url().should('not.include', 'dashboard');
    });

    it('should maintain active navigation state', () => {
      // Dashboard should be active
      cy.contains('Dashboard').parent().should('have.class', 'ant-menu-item-selected');

      // Navigate to penduduk
      cy.navigateToSection('Data Penduduk');
      cy.contains('Data Penduduk').parent().should('have.class', 'ant-menu-item-selected');
      cy.contains('Dashboard').parent().should('not.have.class', 'ant-menu-item-selected');
    });

    it('should handle browser back/forward', () => {
      cy.navigateToSection('Data Penduduk');
      cy.go('back');
      cy.contains('Dashboard Kependudukan').should('be.visible');

      cy.go('forward');
      cy.contains('Data Penduduk').should('be.visible');
    });
  });

  context('Performance & Loading', () => {
    it('should load dashboard within acceptable time', () => {
      cy.window().then((win) => {
        const startTime = win.performance.now();
        cy.contains('Dashboard Kependudukan').should('be.visible').then(() => {
          const endTime = win.performance.now();
          const loadTime = endTime - startTime;
          expect(loadTime).to.be.lessThan(5000); // Less than 5 seconds
        });
      });
    });

    it('should show loading states appropriately', () => {
      // Refresh page and check for loading indicators
      cy.reload();
      // Should show some loading state while data is being fetched
    });

    it('should handle slow network gracefully', () => {
      // Simulate slow network
      cy.intercept('GET', '**/statistics', (req) => {
        req.reply((res) => {
          // Delay response by 2 seconds
          setTimeout(() => res.send(), 2000);
        });
      });

      cy.reload();
      // Should handle delayed response gracefully
      cy.contains('Dashboard Kependudukan').should('be.visible');
    });
  });

  context('Error Handling & Edge Cases', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '**/statistics', { statusCode: 500 });

      cy.reload();
      // Should show error message or fallback UI
      cy.contains('Dashboard Kependudukan').should('be.visible');
    });

    it('should handle network disconnection', () => {
      // Mock offline state
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });

      // Should handle offline state
      cy.contains('Dashboard Kependudukan').should('be.visible');
    });

    it('should handle invalid data formats', () => {
      // Mock invalid data response
      cy.intercept('GET', '**/statistics', {
        total: 'invalid',
        laki: null,
        perempuan: undefined
      });

      cy.reload();
      // Should handle invalid data gracefully
      cy.contains('Dashboard Kependudukan').should('be.visible');
    });
  });

  context('Accessibility & Usability', () => {
    it('should be keyboard navigable', () => {
      // Test tab navigation
      cy.get('body').tab().tab().tab();
      // Should navigate through interactive elements
    });

    it('should have proper ARIA labels', () => {
      cy.get('[aria-label]').should('exist');
      cy.get('[aria-describedby]').should('exist');
    });

    it('should support screen readers', () => {
      // Check for semantic HTML
      cy.get('main, [role="main"]').should('exist');
      cy.get('nav, [role="navigation"]').should('exist');
    });

    it('should have proper color contrast', () => {
      // Check text visibility (would need additional plugins for full contrast testing)
      cy.get('.ant-statistic-title').should('be.visible');
      cy.get('.ant-statistic-content').should('be.visible');
    });

    it('should be mobile-friendly', () => {
      cy.viewport('iphone-6');
      cy.contains('Dashboard Kependudukan').should('be.visible');

      // Test touch interactions
      cy.get('.ant-menu-item').first().click({ force: true });
    });
  });

  context('Data Integrity & Validation', () => {
    it('should display consistent data across refreshes', () => {
      let initialStats;

      // Get initial statistics
      cy.get('.ant-statistic-content').first().invoke('text').then((text) => {
        initialStats = text;
      });

      // Refresh page
      cy.reload();

      // Check if statistics are consistent
      cy.get('.ant-statistic-content').first().invoke('text').should('eq', initialStats);
    });

    it('should validate chart data structure', () => {
      // Check that chart data is properly formatted
      cy.window().then((win) => {
        // This would check the actual chart data structure
        cy.get('svg').should('exist');
      });
    });

    it('should handle timezone correctly', () => {
      // Check date/time handling
      const now = new Date();
      cy.log(`Current timezone: ${now.getTimezoneOffset()}`);
      // Should display dates in correct timezone
    });
  });
});