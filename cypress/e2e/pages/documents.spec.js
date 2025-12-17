describe('Document Uploads', () => {
  let serverId
  let banId

  before(() => {
    // Load test fixture data
    cy.fixture('e2e-data.json').then((data) => {
      serverId = data.serverId
      banId = data.banId
    })
  })

  beforeEach(() => {
    cy.login(Cypress.env('admin_username'), Cypress.env('admin_password'))
  })

  describe('File Selection', () => {
    beforeEach(function () {
      cy.visit(`/appeal/punishment/${serverId}/ban/${banId}`)
      cy.get('[data-cy=upload-dropzone]').should('be.visible')
    })

    it('uploads file via attach button', () => {
      // Click attach button to trigger file input
      cy.get('[data-cy=attach-button]').click()

      // Use Cypress selectFile on the hidden file input (created by @rpldy/uploady)
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })

      // Should show file chip while uploading
      cy.get('[data-cy=file-chip]').should('be.visible')

      // Wait for upload to complete (chip should still be visible after upload)
      cy.get('[data-cy=file-chip]').should('have.length.at.least', 1)
    })

    it('shows file chip during upload', () => {
      cy.get('[data-cy=attach-button]').click()
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.png', { force: true })

      // File chip should appear
      cy.get('[data-cy=file-chip]').should('be.visible')
    })

    it('respects max file limit', () => {
      // Upload files up to the max (5 for appeals)
      for (let i = 0; i < 5; i++) {
        cy.get('[data-cy=attach-button]').click()
        cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
        // Wait for file chip to appear before uploading next
        cy.get('[data-cy=file-chip]').should('have.length', i + 1)
      }

      // Should have 5 file chips
      cy.get('[data-cy=file-chip]').should('have.length', 5)

      // Attach button should be disabled
      cy.get('[data-cy=attach-button]').should('be.disabled')
    })
  })

  describe('Drag and Drop', () => {
    beforeEach(function () {
      cy.visit(`/appeal/punishment/${serverId}/ban/${banId}`)
      cy.get('[data-cy=upload-dropzone]').should('be.visible')
    })

    it('shows drop zone highlight on drag enter', () => {
      cy.fixture('test-image.jpg', 'base64').then(content => {
        const blob = Cypress.Blob.base64StringToBlob(content, 'image/jpeg')
        const file = new File([blob], 'test-image.jpg', { type: 'image/jpeg' })
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)

        cy.get('[data-cy=upload-dropzone]')
          .trigger('dragenter', { dataTransfer, force: true })

        // Check for visual indication (ring class)
        cy.get('[data-cy=upload-dropzone]').should('have.class', 'ring-2')
      })
    })

    it('uploads file on drop', () => {
      cy.get('[data-cy=upload-dropzone]').dropFile('test-image.jpg', 'image/jpeg')

      // Should show file chip after drop
      cy.get('[data-cy=file-chip]').should('be.visible')
    })

    it('handles multiple files', () => {
      // Drop first file
      cy.get('[data-cy=upload-dropzone]').dropFile('test-image.jpg', 'image/jpeg')
      cy.get('[data-cy=file-chip]').should('have.length.at.least', 1)

      // Drop second file
      cy.get('[data-cy=upload-dropzone]').dropFile('test-image.png', 'image/png')
      cy.get('[data-cy=file-chip]').should('have.length.at.least', 2)
    })
  })

  describe('Paste Upload', () => {
    beforeEach(function () {
      cy.visit(`/appeal/punishment/${serverId}/ban/${banId}`)
      cy.get('[data-cy=upload-dropzone]').should('be.visible')
    })

    it('uploads image pasted into textarea', () => {
      // Focus the textarea first
      cy.get('[data-cy=upload-dropzone] textarea').focus()

      // Simulate paste event with image
      cy.get('[data-cy=upload-dropzone]').pasteFile('test-image.jpg', 'image/jpeg')

      // Should show file chip after paste
      cy.get('[data-cy=file-chip]').should('be.visible')
    })
  })

  describe('File Removal', () => {
    beforeEach(function () {
      cy.visit(`/appeal/punishment/${serverId}/ban/${banId}`)
      cy.get('[data-cy=upload-dropzone]').should('be.visible')
    })

    it('removes uploaded file from form', () => {
      // Upload a file first
      cy.get('[data-cy=attach-button]').click()
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })

      // Wait for file chip to appear
      cy.get('[data-cy=file-chip]').should('be.visible')

      // Click remove button
      cy.get('[data-cy=file-chip-remove]').first().click()

      // File chip should be removed
      cy.get('[data-cy=file-chip]').should('not.exist')
    })
  })

  describe('Error Handling', () => {
    beforeEach(function () {
      cy.visit(`/appeal/punishment/${serverId}/ban/${banId}`)
      cy.get('[data-cy=upload-dropzone]').should('be.visible')
    })

    it('rejects invalid file types', () => {
      // Create a text file (not allowed)
      cy.get('[data-cy=attach-button]').click()

      // The file filter in Uploady should reject non-image files
      // This tests that the file input only accepts images
      cy.get('input[type="file"]').should('have.attr', 'accept', 'image/*')
    })
  })

  describe('Document Deletion (After Submission)', () => {
    // These tests share a single appeal since we can only appeal a ban once
    let appealUrl

    it('creates appeal with documents and can delete them', () => {
      cy.visit(`/appeal/punishment/${serverId}/ban/${banId}`)
      cy.get('[data-cy=upload-dropzone]').should('be.visible')

      // Upload a file
      cy.get('[data-cy=attach-button]').click()
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })

      // Wait for upload to complete (file chip shows and is stable)
      cy.get('[data-cy=file-chip]').should('be.visible')
      cy.get('[data-cy=file-chip]').should('have.length', 1)

      // Type appeal reason (minimum 20 characters)
      cy.get('[data-cy=upload-dropzone] textarea').type('This is a test appeal reason with enough characters to meet the minimum requirement.')

      // Submit the appeal
      cy.get('[data-cy=submit-appeal]').should('not.be.disabled')
      cy.get('[data-cy=submit-appeal]').click()

      // Should redirect to the appeal page (with longer timeout for server processing)
      cy.url({ timeout: 10000 }).should('include', '/appeals/')

      // Store the appeal URL for the next test
      cy.url().then(url => {
        appealUrl = url
      })

      // Should see the uploaded document
      cy.get('[data-cy=document-item]', { timeout: 10000 }).should('be.visible')

      // Click delete button (need to hover first to make it visible)
      cy.get('[data-cy=document-item]').first().trigger('mouseover')
      cy.get('[data-cy=document-delete]').first().click({ force: true })

      // Confirmation modal should appear
      cy.get('[data-cy=modal-confirm]').should('be.visible')

      // Confirm deletion
      cy.get('[data-cy=modal-confirm]').click()

      // Wait for modal to close
      cy.get('[data-cy=modal-confirm]').should('not.exist')

      // Reload the page to verify document was actually deleted from server
      cy.reload()
      cy.get('[data-cy=document-item]', { timeout: 10000 }).should('not.exist')
    })

    it('cancels deletion on modal cancel', function () {
      // Skip if previous test didn't create an appeal
      if (!appealUrl) {
        this.skip()
      }

      // Visit the existing appeal and add a comment with a document
      cy.visit(appealUrl)

      // Wait for page to load
      cy.get('[data-cy=submit-report-comment-form]', { timeout: 10000 }).should('be.visible')

      // Upload a file via the comment form
      cy.get('[data-cy=attach-button]').click()
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })

      // Wait for upload to complete (file chip shows and is stable)
      cy.get('[data-cy=file-chip]').should('be.visible')
      cy.get('[data-cy=file-chip]').should('have.length', 1)

      // Type a comment
      cy.get('[data-cy=upload-dropzone] textarea').type('Adding a comment with a document for testing.')

      // Submit the comment
      cy.get('[data-cy=submit-report-comment-form]').click()

      // Wait for comment to appear with document
      cy.get('[data-cy=document-item]', { timeout: 10000 }).should('be.visible')

      // Click delete button on the document
      cy.get('[data-cy=document-item]').first().trigger('mouseover')
      cy.get('[data-cy=document-delete]').first().click({ force: true })

      // Confirmation modal should appear
      cy.get('[data-cy=modal-cancel]').should('be.visible')

      // Cancel deletion
      cy.get('[data-cy=modal-cancel]').click()

      // Modal should close
      cy.get('[data-cy=modal-cancel]').should('not.exist')

      // Document should still exist
      cy.get('[data-cy=document-item]').should('be.visible')
    })
  })
})
