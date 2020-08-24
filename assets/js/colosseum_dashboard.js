$(function() {
  let cookie_nightmares = getCookies();
  let all_nightmares;

  // Add Nightmare elements
  let target_nightmare_list_id;
  let $target_nightmare_list;
  const $add_nightmare_button   = $('.add-nightmare-btn');
  const $add_nightmare_modal    = $('#add-nightmare');
  const $nightmare_selector     = $('#nightmare-selector');
  const $reset_nightmare_button = $('.reset-nightmare-btn');

  // Nightmare import/export elements
  const $import_nightmares_modal    = $('#import-nightmares');
  const $export_nightmares_modal    = $('#export-nightmares');
  const $import_nightmares_button   = $('.import-nightmares-btn');
  const $export_nightmares_button   = $('.export-nightmares-btn');
  const $import_nightmare_form      = $('#import-nightmares-form');
  const $import_nightmare_form_data = $import_nightmare_form.find('textarea');
  const $export_nightmare_data      = $('#export-nightmares-data');
  const $export_nightmare_copy_btn  = $('#export-nightmares-copy-btn');

  const $body = $('body');

  // Initialize static chosen fields
  $('.chosen').chosen({ width: '100%' });

  // Get nightmare data from JSON
  $.getJSON('/data/colosseum_dashboard/nightmares.json', function(data) {
    // Set JSON data to variable
    all_nightmares = data;
  }).done(function() {
    let nightmare_options = [];
    let nightmare_selector_html;

    // Once JSON is loaded properly, create dropdown for "Add Nightmare"
    $.each(all_nightmares, function(nightmare_name, nightmare_info) {
      nightmare_options.push(generateNightmareSelectorOption(nightmare_name, nightmare_info.image));
    });

    // Add dropdown for nightmares
    nightmare_selector_html = nightmare_options.join('');
    $nightmare_selector.append(nightmare_selector_html).chosen({ width: '100%' }).change(function(e) {
      // On nightmare select, add nightmare data to respective list
      const $nightmare = $(generateNightmare(all_nightmares, e.target.value));
      $target_nightmare_list.append($nightmare);
      
      // Add popover to unsummoned nightmares
      $('.nightmare-unsummoned').popover({ html: true, trigger: 'hover' });

      // Update cookie
      const target_nightmare_list_id = $target_nightmare_list[0].id;
      saveCookie(cookie_nightmares, target_nightmare_list_id, $target_nightmare_list);
        
      // Clear Input and hide modal
      $nightmare_selector.val('').trigger('chosen:updated');
      $add_nightmare_modal.modal('hide');
    });

    // Hide modal after appending dropdown info
    $add_nightmare_modal.removeClass('display-block');

    // Populate page with cookie data
    populateNightmares(all_nightmares, cookie_nightmares);
  });

  // Modals don't know what section they should be sending data to.
  // Grab the nightmare section to target from the button and save it to a variable the modal to access.
  $add_nightmare_button.add($import_nightmares_button).add($export_nightmares_button).add($reset_nightmare_button).click(function() {
    target_nightmare_list_id = $(this).data('list');
    $target_nightmare_list   = $(`#${target_nightmare_list_id}`);
  });

  $add_nightmare_modal.on('shown.bs.modal', function() {
    $nightmare_selector.trigger('chosen:open');
  });

  // When adding a nightmare, add it to the list the button is a part of.
  // This make the button works for all nightmare lists without custom buttons.
  $reset_nightmare_button.click(function() {
    clearNightmareList($target_nightmare_list);
    saveCookie(cookie_nightmares, target_nightmare_list_id, $target_nightmare_list);
  });

  // Save nightmare information after summoner is updated
  $body.on('keyup', '.nightmare-summoner', function() {
    // Get nightmares list
    target_nightmare_list_id = $(this).closest('.nightmares-list')[0].id;
    $target_nightmare_list   = $(`#${target_nightmare_list_id}`);

    saveCookie(cookie_nightmares, target_nightmare_list_id, $target_nightmare_list);
  });

  // On nightmare checkbox toggle, darken icon and disable popovers
  $body.on('change', '.nightmare-checkbox', function() {
    const $nightmare = $(this).closest('.nightmare');
    $nightmare.toggleClass('nightmare-unsummoned').toggleClass('nightmare-summoned');

    // Reinitialize popovers and destroy on summoned nightmares
    $('.nightmare-unsummoned').popover('enable');
    $('.nightmare-summoned').popover('disable');
  });

  $import_nightmare_form.submit(function(e){
    e.preventDefault();
    const encoded_nightmares = $import_nightmare_form_data.val();
    const decoded_nightmares = uriDecodeArray(encoded_nightmares.split(','));

    clearNightmareList($target_nightmare_list);
    populateNightmaresList($target_nightmare_list, all_nightmares, decoded_nightmares);
    saveCookie(cookie_nightmares, target_nightmare_list_id, $target_nightmare_list);

    $import_nightmare_form_data.val('');
    $import_nightmares_modal.modal('hide');
  });

  // On nightmare export
  $export_nightmares_modal.on('shown.bs.modal', function() {
    const encoded_nightmares = uriEncodeArray(cookie_nightmares[target_nightmare_list_id]);
    $export_nightmare_data.html(encoded_nightmares.join(','));
  });

  // Auto-copy data on click
  $export_nightmare_copy_btn.click(function() {
    $export_nightmare_data.select();
    document.execCommand('copy');
    $export_nightmares_modal.modal('hide');
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
function saveCookie(cookie_nightmares, target_nightmare_list_id, target_nightmare_list) {
  cookie_nightmares[target_nightmare_list_id] = getNightmareList(target_nightmare_list);

  const encoded_nightmares = uriEncodeArray(cookie_nightmares[target_nightmare_list_id]);
  document.cookie = `${target_nightmare_list_id}=${encoded_nightmares.join(',')}`;
};

function populateNightmaresList(nightmares_list, all_nightmares, nightmares) {
  $.each(nightmares, function(_index, nightmare){
    const [nightmare_name, summoner] = nightmare.split('::');
    const $nightmare = generateNightmare(all_nightmares, nightmare_name, summoner);
    nightmares_list.append($nightmare);
  });

  $('.nightmare-unsummoned').popover({ html: true, trigger: 'hover' });
}

// Populates nightmares on the page using the cookie data
function populateNightmares(all_nightmares, cookie_data) {
  $.each(cookie_data, function(key, cookie_nightmares) {
    const $target_nightmare_list = $(`#${key}`);

    if(cookie_nightmares.length == 1) {
      if(cookie_nightmares[0] == "") {
        return true;
      }
    }

    populateNightmaresList($target_nightmare_list, all_nightmares, cookie_nightmares);
  });
};

// Returns the list of current nightmares on the page for a section
function getNightmareList(nightmare_list) {
  if(nightmare_list.length < 1) { return []; }

  return $.map(nightmare_list.find('.nightmare'), function(nightmare, _index) {
    const $nightmare = $(nightmare);
    return `${$nightmare.data('title')}::${$nightmare.find('.nightmare-summoner').val()}`;
  });
}

// Clear all nightmares in the list
function clearNightmareList(nightmare_list) {
  nightmare_list.find('.nightmare').remove();
};

// URI encode items in an array
function uriEncodeArray(array) {
  return $.map(array, function(nightmare) {
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