$.noConflict();

jQuery(document).ready(function($) {
  "use strict";

  [].slice
    .call(document.querySelectorAll("select.cs-select"))
    .forEach(function(el) {
      new SelectFx(el);
    });

  jQuery(".selectpicker").selectpicker;

  $("#menuToggle").on("click", function(event) {
    if ($("body").hasClass("open")) {
      $("body").removeClass("open");

      $("a").attr("href", function(i, h) {
        if (h) {
          return h + (h.indexOf("?") != -1 ? "&sidebar=open" : "?sidebar=open");
        }
      });

      $("form").attr("action", function(i, h) {
        if (h) {
          return h + (h.indexOf("?") != -1 ? "&sidebar=open" : "?sidebar=open");
        }
      });
    } else {
      $("body").addClass("open");

      $("a").attr("href", function(i, h) {
        if (h) {
          return (
            h + (h.indexOf("?") != -1 ? "&sidebar=closed" : "?sidebar=closed")
          );
        }
      });

      $("form").attr("action", function(i, h) {
        if (h) {
          return (
            h + (h.indexOf("?") != -1 ? "&sidebar=closed" : "?sidebar=closed")
          );
        }
      });
    }
  });

  $(".search-trigger").on("click", function(event) {
    event.preventDefault();
    event.stopPropagation();
    $(".search-trigger")
      .parent(".header-left")
      .addClass("open");
  });

  $(".search-close").on("click", function(event) {
    event.preventDefault();
    event.stopPropagation();
    $(".search-trigger")
      .parent(".header-left")
      .removeClass("open");
  });

  // $('.user-area> a').on('click', function(event) {
  // 	event.preventDefault();
  // 	event.stopPropagation();
  // 	$('.user-menu').parent().removeClass('open');
  // 	$('.user-menu').parent().toggleClass('open');
  // });
});
