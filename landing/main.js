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
  })
})()
