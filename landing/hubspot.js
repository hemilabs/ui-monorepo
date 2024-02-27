;(function () {
  'use strict'

  $(document).ready(function () {
    // Add the hubspot form
    // Check https://legacydocs.hubspot.com/docs/methods/forms/advanced_form_options
    hbspt.forms.create({
      // required to apply custom styles in globals.css
      css: '',
      formId: 'f8a844d5-0803-482d-b43e-23b328a1cdbb',
      portalId: '21449954',
      region: 'na1',
      target: '#hubspot-target-form',
    })
  })
})()
