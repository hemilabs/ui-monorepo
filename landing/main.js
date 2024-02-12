;(function () {
  'use strict'

  $(document).ready(function () {
    function enableScroll() {
      // Based on https://github.com/seeratawan01/fullview.js
      // See https://seeratawan.medium.com/how-to-build-a-full-screen-scrolling-website-12113bb98088
      $('#fullview').fullView()
    }

    function disableScroll() {
      const scrollContainer = $('#fullview')
      scrollContainer.data('fullView').destroy()
      // remove scrolling dots
      $('#fv-dots').remove()
      // clear data so it can be re-initialized
      scrollContainer.removeData('fullView')
    }

    $('.burguer-menu').click(function openSidebar() {
      const sidebar = $('.sidebar')
      sidebar.removeClass('hidden')

      disableScroll()
    })

    $('.sidebar-close').click(function closeSidebar() {
      const sidebar = $('.sidebar')
      sidebar.addClass('hidden')

      enableScroll()
    })

    // on Ready, enable scroll
    enableScroll()
    // and add the hubspot form
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
