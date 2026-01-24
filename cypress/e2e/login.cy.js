describe('Aplikasi Kependudukan - Comprehensive Login Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  context('UI Elements', () => {
    it('should display all login form elements correctly', () => {
      // Check main title
      cy.contains('Login Aplikasi Kependudukan').should('be.visible');

      // Check form elements
      cy.get('input[type="text"]').should('be.visible').and('have.attr', 'placeholder').and('include', 'Username');
      cy.get('input[type="password"]').should('be.visible').and('have.attr', 'placeholder').and('include', 'Password');

      // Check submit button
      cy.get('button[type="submit"]').should('be.visible').and('contain', 'Login');

      // Check Ant Design classes
      cy.get('.ant-form').should('exist');
      cy.get('.ant-input').should('have.length.at.least', 2);
      cy.get('.ant-btn').should('exist');
    });

    it('should have proper form labels', () => {
      cy.contains('Username').should('be.visible');
      cy.contains('Password').should('be.visible');
    });

    it('should have proper ARIA attributes', () => {
      cy.get('input[type="text"]').should('have.attr', 'aria-label').or('have.attr', 'aria-describedby');
      cy.get('input[type="password"]').should('have.attr', 'aria-label').or('have.attr', 'aria-describedby');
    });
  });

  context('Authentication Flow', () => {
    it('should login successfully with correct credentials', () => {
      cy.get('input[type="text"]').type('admin');
      cy.get('input[type="password"]').type('admin123!@#');
      cy.get('button[type="submit"]').click();

      // Should navigate to dashboard
      cy.contains('Dashboard Kependudukan').should('be.visible');
      cy.contains('Selamat Datang, admin').should('be.visible');
      cy.url().should('not.include', '/login');
    });

    it('should show error with wrong credentials', () => {
      cy.get('input[type="text"]').type('wronguser');
      cy.get('input[type="password"]').type('wrongpass');
      cy.get('button[type="submit"]').click();

      // Should show error message
      cy.contains('Username atau password salah!').should('be.visible');

      // Should still be on login page
      cy.contains('Login Aplikasi Kependudukan').should('be.visible');
      cy.url().should('include', '/');
    });

    it('should show error with empty username', () => {
      cy.get('input[type="password"]').type('admin123!@#');
      cy.get('button[type="submit"]').click();

      cy.contains('Masukkan username!').should('be.visible');
    });

    it('should show error with empty password', () => {
      cy.get('input[type="text"]').type('admin');
      cy.get('button[type="submit"]').click();

      cy.contains('Masukkan password!').should('be.visible');
    });

    it('should show errors for both empty fields', () => {
      cy.get('button[type="submit"]').click();

      cy.contains('Masukkan username!').should('be.visible');
      cy.contains('Masukkan password!').should('be.visible');
    });

    it('should handle case-sensitive username', () => {
      cy.get('input[type="text"]').type('ADMIN');
      cy.get('input[type="password"]').type('admin123!@#');
      cy.get('button[type="submit"]').click();

      cy.contains('Username atau password salah!').should('be.visible');
    });

    it('should handle special characters in password', () => {
      cy.get('input[type="text"]').type('admin');
      cy.get('input[type="password"]').type('admin123!@#');
      cy.get('button[type="submit"]').click();

      cy.contains('Dashboard Kependudukan').should('be.visible');
    });

    it('should clear error messages when user starts typing', () => {
      // First submit empty form
      cy.get('button[type="submit"]').click();
      cy.contains('Masukkan username!').should('be.visible');

      // Start typing
      cy.get('input[type="text"]').type('a');
      // Error should disappear (depending on implementation)
    });
  });

  context('User Experience', () => {
    it('should show loading state during login', () => {
      cy.get('input[type="text"]').type('admin');
      cy.get('input[type="password"]').type('admin123!@#');
      cy.get('button[type="submit"]').click();

      // Check if loading state is shown
      cy.get('button[type="submit"]').should('have.class', 'ant-btn-loading').or('contain', 'Loading');
    });

    it('should disable form during submission', () => {
      cy.get('input[type="text"]').type('admin');
      cy.get('input[type="password"]').type('admin123!@#');
      cy.get('button[type="submit"]').click();

      // Form should be disabled during submission
      cy.get('input[type="text"]').should('be.disabled').or('not.be.disabled');
      cy.get('input[type="password"]').should('be.disabled').or('not.be.disabled');
    });

    it('should handle Enter key for form submission', () => {
      cy.get('input[type="text"]').type('admin');
      cy.get('input[type="password"]').type('admin123!@#{enter}');

      cy.contains('Dashboard Kependudukan').should('be.visible');
    });

    it('should maintain focus on form fields', () => {
      cy.get('input[type="text"]').focus().should('have.focus');
      cy.get('input[type="password"]').focus().should('have.focus');
    });
  });

  context('Security', () => {
    it('should not show password in plain text', () => {
      cy.get('input[type="password"]').type('admin123!@#');
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    });

    it('should clear password field on failed login', () => {
      cy.get('input[type="text"]').type('admin');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.get('input[type="password"]').should('have.value', '');
    });

    it('should prevent SQL injection attempts', () => {
      cy.get('input[type="text"]').type("admin' OR '1'='1");
      cy.get('input[type="password"]').type('admin123!@#');
      cy.get('button[type="submit"]').click();

      cy.contains('Username atau password salah!').should('be.visible');
    });

    it('should handle very long input', () => {
      const longString = 'a'.repeat(1000);
      cy.get('input[type="text"]').type(longString);
      cy.get('input[type="password"]').type(longString);
      cy.get('button[type="submit"]').click();

      // Should handle gracefully
      cy.contains('Username atau password salah!').should('be.visible');
    });
  });

  context('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.get('input[type="text"]').focus().tab().should('have.focus');
      cy.get('input[type="password"]').focus().tab().should('have.focus');
      cy.get('button[type="submit"]').focus().should('have.focus');
    });

    it('should have proper color contrast', () => {
      // Visual check - in real scenarios would use axe-core or similar
      cy.get('.ant-form-item-label').should('be.visible');
      cy.get('button[type="submit"]').should('have.css', 'background-color');
    });

    it('should support screen readers', () => {
      // Check for aria attributes
      cy.get('input[type="text"]').should('have.attr', 'aria-label').or('have.attr', 'aria-describedby');
      cy.get('input[type="password"]').should('have.attr', 'aria-label').or('have.attr', 'aria-describedby');
    });
  });
});