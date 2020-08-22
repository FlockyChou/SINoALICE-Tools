$(function() {
  let nightmare_cookie = getCookies();

  // Nightmare select dropdown variables
  let first_modal_load  = true;
  let nightmares;
  let nightmare_options = [];
  let nightmare_selector_data;

  // Nightmare UI elements
  let $nightmares_list;
  const $add_nightmare_button   = $('.add-nightmare-btn');
  const $add_nightmare_modal    = $('#add-nightmare');
  const $nightmare_selector     = $('#nightmare-selector');
  const $reset_nightmare_button = $('.reset-nightmare-btn');

  const $body = $('body');

  // Initialize static chosen fields
  $('.chosen').chosen({ width: '100%' });

  // Get nightmare data from JSON
  $.getJSON('/data/colosseum_dashboard/nightmares.json', function(data) {
    // Set JSON data to variable
    nightmares = data;
  }).done(function() {
    $.each(nightmares, function(nightmare_name, nightmare) {
      nightmare_options.push(generateNightmareSelectorOption(nightmare_name, nightmare.image));
    });

    nightmare_selector_data = nightmare_options.join('');

    // Populate page with cookie data
    populateNightmares(nightmares, nightmare_cookie);
  });

  // When adding a nightmare, add it to the list the button is a part of.
  // This make the button works for all nightmare lists without custom buttons.
  $add_nightmare_button.click(function() {
    const list_id = $(this).data('list');
    $nightmares_list = $(`#${list_id}`);
  });

  // When adding a nightmare, add it to the list the button is a part of.
  // This make the button works for all nightmare lists without custom buttons.
  $reset_nightmare_button.click(function() {
    const list_id = $(this).data('list');
    $nightmares_list = $(`#${list_id}`);
    $nightmares_list.find('.nightmare').remove();

    nightmare_cookie[list_id] = getNightmaresList($nightmares_list);
    saveCookies(nightmare_cookie);
  });

  // Save nightmare information after summoner is updated
  $body.on('keyup', '.nightmare-summoner', function() {
    const $this    = $(this);
    const summoner = $this.val();

    const list_id = $this.closest('.nightmares-list')[0].id;
    $nightmares_list = $(`#${list_id}`);

    nightmare_cookie[list_id] = getNightmaresList($nightmares_list);
    saveCookies(nightmare_cookie);
  });

  // Since we can't add things to hidden elements (I need to find a better way to do this),
  //   do the magic and add items to the nightmare select list on first modal load.
  //
  // This totally breaks sometimes.
  $add_nightmare_modal.on('shown.bs.modal', function (e) {
    // On first time showing modal, add elements to dropdown
    if(first_modal_load) {
      $nightmare_selector.append(nightmare_selector_data).chosen({ width: '100%' }).change(function(e) {
        // Append nightmare to the respective list
        const $nightmare = $(generateNightmare(nightmares, e.target.value));
        $nightmares_list.append($nightmare);
        $('.nightmare-unsummoned').popover({ html: true, trigger: 'hover' });

        const nightmare_key  = $nightmares_list[0].id;
        nightmare_cookie[nightmare_key] = getNightmaresList($nightmares_list);
        saveCookies(nightmare_cookie);
        
        // Clear Input and hide modal
        $nightmare_selector.val('').trigger("chosen:updated");
        $add_nightmare_modal.modal('hide');
      });

      first_modal_load = false;
    }
  });

  // On nightmare checkbox toggle, 
  $body.on('change', '.nightmare-checkbox', function() {
    const $nightmare = $(this).closest('.nightmare');

    if(this.checked) {
      $nightmare.removeClass('nightmare-unsummoned').addClass('nightmare-summoned');
    } else {
      $nightmare.addClass('nightmare-unsummoned').removeClass('nightmare-summoned');
    }

    // Reinitialize popovers and destroy on summoned nightmares
    $('.nightmare-unsummoned').popover('enable');
    $('.nightmare-summoned').popover('disable');
  });
});

// Get cookies for page
function getCookies() {
  if(document.cookie == "") {
    let cookie = {};
    $.each($('.nightmares-list'), function(_index, list) {
      cookie[list.id] = [];
    });
    
    return cookie;
  }

  const cookies   = document.cookie.split('; ');
  let cookie_data = {}

  $.each(cookies, function(_index, cookie) {
    const [key, values] = cookie.split('=');
    cookie_data[key] = uriDecodeArray(values.split(','));
  });

  return cookie_data;
};

// Save cookies for page
function saveCookies(cookies) {
  $.each(cookies, function(key, nightmares) {
    const encoded_nightmares = uriEncodeArray(nightmares);
    document.cookie = `${key}=${encoded_nightmares.join(',')}`;
  });
};

// Populates nightmares on the page using the cookie data
function populateNightmares(nightmares, cookie_data) {
  $.each(cookie_data, function(key, cookie_nightmares) {
    const $nightmares_list = $(`#${key}`);

    if(cookie_nightmares.length == 1) {
      if(cookie_nightmares[0] == "") {
        return true;
      }
    }

    $.each(cookie_nightmares, function(_index, cookie_nightmare) {
      const [nightmare_name, summoner] = cookie_nightmare.split('::');
      const $nightmare = generateNightmare(nightmares, nightmare_name, summoner);
      $nightmares_list.append($nightmare);
    });
  });
};

// Returns the list of current nightmares on the page for a section
function getNightmaresList(nightmares_list) {
  if(nightmares_list.length < 1) { return []; }

  return $.map(nightmares_list.find('.nightmare'), function(nightmare, _index) {
    const $nightmare = $(nightmare);
    return `${$nightmare.data('title')}::${$nightmare.find('.nightmare-summoner').val()}`;
  });
}

// URI encode items in an array
function uriEncodeArray(array) {
  return $.map(array, function(nightmare, _index) {
    return encodeURIComponent(nightmare);
  });
}

// URI encode items in an array
function uriDecodeArray(array) {
  return $.map(array, function(nightmare, _index) {
    return decodeURIComponent(nightmare);
  });
}

// Genearte nightmare option > select
function generateNightmareSelectorOption(nightmare_name, image_name) {
  return `<option data-img-src="/assets/img/nightmares/${image_name}">${nightmare_name}</option>`;
}

// Generate nightmare checkbox
function generateNightmare(nightmares, nightmare_name, summoner = "") {
  const nightmare  = nightmares[nightmare_name];
  let effect_icons = [];

  // Generate popover data to append later
  const nightmare_skill_name = nightmare.skill_name;
  const popover_data = `
    <strong>${nightmare_skill_name}</strong>
    <p>${nightmare.description}</p>
    <p class='mb-0'>
      <strong>SP:</strong> ${nightmare.sp_cost} <br/>
      <strong>Charge Time:</strong> ${nightmare.charge_time_in_seconds} secs <br/>
      <strong>Duration:</strong> ${nightmare.duration_in_seconds} secs
    </p>
  `;

  // Generate nightmare effect icons to append later
  $.each(nightmare.effects, function(_index, effect) {
    effect_icons.push(`<img class="nightmare-effect" src="/assets/img/effects/${effect}.png" alt="${effect}" draggable="false">`);
  });

  // Put it all together
  return `
    <label class="card nightmare nightmare-unsummoned pull-left mr-2" data-toggle="popover" data-placement="bottom" data-title="${nightmare_name}" data-content="${popover_data}">
      <div class="nightmare-info d-flex flex-row">
        <div class="nightmare-checkbox-container p-2 bg-light border-right">
          <input class="nightmare-checkbox" type="checkbox">
        </div>
        <div class="nightmare-image-container p-2">
          <img class="nightmare-image" src="/assets/img/nightmares/${nightmare.image}" alt="${nightmare_name}" draggable="false">
          <div class="nightmare-effects text-center">${effect_icons.join('')}</div>
        </div>
      </div>
      <div class="border-top">
        <input class="nightmare-summoner form-control form-control-sm border-0" type="text" placeholder="N/A" value="${summoner}">
      </div>
    </label>
  `;
}