;(function () {
  'use strict'

  $(document).ready(function () {
    const getSidebar = () => $('.sidebar')

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

    // Open the mobile sidebar
    $('.burguer-menu').click(function openSidebar() {
      const sidebar = getSidebar()
      sidebar.removeClass('hidden')

      disableScroll()
    })

    function closeSidebar() {
      const sidebar = getSidebar()
      sidebar.addClass('hidden')

      enableScroll()
    }

    // close the mobile sidebar
    $('.sidebar-close').click(closeSidebar)

    // Update contact link to scroll to the contact section
    $('button.contact-link').click(function scrollToContactSection() {
      const sidebar = getSidebar()
      // if sidebar is visible, it means it is open
      if (!sidebar.hasClass('hidden')) {
        closeSidebar()
      }
      // scroll to contact section, which is the third one (0-indexed)
      $('#fullview').data('fullView').scrollTo(2)
    })

    // on Ready, enable scroll
    enableScroll()
  })
})()
