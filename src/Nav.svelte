<script>
  import axios from 'axios';

  export let active;
  export let scrollEffect = "true";
  var nav = "";

  window.addEventListener('scroll', () => {
    if (scrollEffect == "false") { nav.style.backgroundColor = `black`; return; }
    let y = 1 + (window.scrollY || window.pageYOffset) / 150
    y = y < 1 ? 1 : y // ensure y is always >= 1 (due to Safari's elastic scroll)
    //console.log(y); // for debugging
    if (y < 5.76) {
      nav.style.backgroundColor = `transparent`;
    } else {
      nav.style.backgroundColor = `black`;
    }
  })
</script>

<nav bind:this={nav} class="navbar navbar-expand-lg fixed-top {scrollEffect === 'true' ? 'transparent' : 'black'}">
    <a class="navbar-brand" href="/">Vortex</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarSupportedContent">
      <ul class="navbar-nav mr-auto">

        <li class="nav-item"><a class="nav-link {active === 'home' ? 'active' : ''}" href="/">Home</a></li>
        <li class="nav-item"><a class="nav-link {active === 'search' ? 'active' : ''}" href="/?tab=search">Search</a></li>
        <li class="nav-item"><a class="nav-link {active === 'favorites' ? 'active' : ''}" href="/?tab=favorites">Favorites</a></li>
        <li class="nav-item"><a class="nav-link {active === 'playlists' ? 'active' : ''}" href="/?tab=playlists">Playlists</a></li>
        <li class="nav-item"><a class="nav-link {active === 'addons' ? 'active' : ''}" href="/?tab=addons">Addons</a></li>

        {#await axios.get("/api/userInfo", {transformResponse: (res) => { return JSON.parse(res); }, responseType: 'json'})}
						<p></p>
				{:then resp}
						{#if resp.data.isAdmin}
            <li class="nav-item">
              <a class="nav-link" style="margin-left: 61vw;" href="/?tab=settings">Settings</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/admin">Admin CP</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/logout">Logout</a>
            </li>
            {:else}
            <li class="nav-item">
              <a class="nav-link {active === 'settings' ? 'active' : ''}" style="margin-left: 65vw;" href="/?tab=settings">Settings</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/logout">Logout</a>
            </li>
            {/if}
				{:catch error}
          <p></p>
				{/await}
      </ul>
    </div>
</nav>


<style>
@font-face {
  font-family: 'ModernWarfare';
  src: url('/static/fonts/ModernWarfare.ttf');
}

/*
.custom {
  margin-left: 67%!important;
  width: 20%!important;
  background-color: black!important;
  border: 0px;
  border-bottom: #6d737a 3px solid;
}
*/

.black {
  background-color: black;
}

.transparent {
  background-color: transparent;
}

nav {
  background-color: transparent;
  width: 100%;
  margin-bottom: 10px;
}

.navbar-brand {
  font-family: 'ModernWarfare';
  color: blue;
  margin-right: 2%!important;
  padding-left: 1%;
}

.navbar-brand:hover {
  color: #1703cc;
}

.nav-link {
  color:  #3d3d3d!important;
}

.active {
  color: #6d737a!important;
}
</style>