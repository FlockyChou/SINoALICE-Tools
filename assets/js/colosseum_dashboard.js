$(function() {
  let first_modal_load = true;

  let nightmares;
  let nightmare_options = [];
  let nightmare_selector_data;

  let $nightmares_list;
  
  const $add_nightmare_button = $('.add-nightmare-btn');
  const $add_nightmare_modal  = $('#add-nightmare');
  const $nightmare_selector   = $('#nightmare-selector');

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
  });

  $add_nightmare_button.click(function(e) {
    console.log(this);
    $nightmares_list = $(this).closest('.nightmares-list');
    console.log($nightmares_list);
  });

  $add_nightmare_modal.on('shown.bs.modal', function (e) {
    // On first time showing modal, add elements to dropdown
    if(first_modal_load) {
      $nightmare_selector.append(nightmare_selector_data).chosen({ width: '100%' }).change(function(e) {
        // Add to summon order

        let $nightmare = $(generateNightmare(nightmares, e.target.value));
        $nightmares_list.append($nightmare);
        $('.nightmare').popover({ html: true, trigger: 'hover' });
        
        // Clear Input and hide modal
        $nightmare_selector.val('').trigger("chosen:updated");
        $add_nightmare_modal.modal('hide');
      });

      first_modal_load = false;
    }
  });
});

function generateNightmareSelectorOption(nightmare_name, image_name) {
  return `<option data-img-src="/assets/img/nightmares/${image_name}">${nightmare_name}</option>`;
}

function generateNightmare(nightmares, nightmare_name) {
  const nightmare  = nightmares[nightmare_name];
  let effect_icons = [];

  $.each(nightmare.effects, function(index, effect) {
    effect_icons.push(`<img class="nightmare-effect" src="/assets/img/effects/${effect}.png" alt="${effect}" draggable="false">`);
  });

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

  return `
    <label class="card nightmare d-flex flex-row pull-left mr-3" data-toggle="popover" data-placement="bottom" data-title="${nightmare_name}" data-content="${popover_data}">
      <div class="nightmare-checkbox-container p-2 bg-light border-right">
        <input class="nightmare-checkbox" type="checkbox">
      </div>
      <div class="nightmare-image-container p-2">
        <img class="nightmare-image" src="/assets/img/nightmares/${nightmare.image}" alt="${nightmare_name}" draggable="false">
        <div class="nightmare-effects text-center">${effect_icons.join('')}</div>
      </div>
    </label>
  </button>
  `;
 }