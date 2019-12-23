$(document).ready(function() {
  $(".save-button").on("click", function() {
    var id = this.id;
    var title = $("#title" + id).text();
    var savedItem = {
      title: title
    };
    $.post("/api/saved", savedItem);
    alert("Article Saved");
  });

  $(".delete-button").on("click", function() {
    var id = this.id;
    var title = $("#title" + id).text();
    var savedItem = {
      title: title
    };
    $.post("/api/delete", savedItem);
    location.reload(false);
  });
});
