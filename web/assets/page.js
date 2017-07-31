const leftMenu = `
  <i class="fa fa-coffee logo"></i>
  <ul class="nav navbar-nav">
   <li><a href="read.html"><i class="fa fa-coffee active"></i></a></li>
   <li><a href="edit.html"><i class="fa fa-edit"></i></a></li>
   <li><a href="setting.html"><i class="fa fa-gears"></i></a></li>
  </ul>
`;


$(()=>{
    $(".navbar").html(leftMenu);
})