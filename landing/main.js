;(function () {
  'use strict'

  $(document).ready(function () {
    const getSidebar = () => $('.sidebar')

    // Open the mobile sidebar
    $('.burguer-menu').click(function openSidebar() {
      const sidebar = getSidebar()
      sidebar.removeClass('hidden')
    })

    // close the mobile sidebar
    $('.sidebar-close').click(function closeSidebar() {
      const sidebar = getSidebar()
      sidebar.addClass('hidden')
    })
  })
})()
