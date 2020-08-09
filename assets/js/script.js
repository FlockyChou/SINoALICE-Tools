$(function() {
  let missions;

  $.getJSON('/data/missions.json', function(data) {
    missions = data;
  }).done(function() {
    missions = missions.sort(function(key_1, key_2) {
      return -(key_1.experience_ratio - key_2.experience_ratio);
    });
  });

  const $form        = $('#experience-form');
  const $tbody       = $('tbody');
  const $current_exp = $('#current-experience');
  const $max_exp     = $('#max-experience');
  const $ap          = $('#ap');

  $form.submit(function(e) {
    e.preventDefault();

    // Clear the table
    $tbody.html('');

    let remaining_exp = $max_exp.val() - $current_exp.val();
    let remaining_ap  = $ap.val();

    let mission_list = [];
    let exp_list     = [];
    let ap_list      = [];

    // Used later on to track what option wastes the least amount of AP.
    let lowest_ap  = remaining_ap;
    let lowest_exp = remaining_exp;

    $tbody.append(`
      <tr>
        <td>Start</td>
        <td class="text-right">-</td>
        <td class="text-right">${remaining_exp}</td>
        <td class="text-right">${remaining_ap}</td>
      </tr>
    `);

    while(remaining_exp > 0) {
      $.each(missions, function(index, mission) {
        // Skip if AP cost is too high
        if(mission.ap_cost > remaining_ap) { return true; }
        // Skip if experience earned is greater than remaining

        let temp_remaining_exp = remaining_exp - mission.experience_earned;
        let temp_remaining_ap  = remaining_ap  - mission.ap_cost;

        if(0 > temp_remaining_exp) {
          if(lowest_ap > temp_remaining_ap) {
            lowest_ap = temp_remaining_ap;
            return true;
          }
        }

        remaining_exp = temp_remaining_exp;
        remaining_ap  = temp_remaining_ap;

        $tbody.append(`
          <tr>
            <td>Act ${mission.act}, Chapter ${mission.chapter}</td>
            <td class="text-right">${mission.experience_ratio}</td>
            <td class="text-right">${remaining_exp} <span class="text-danger">(-${mission.experience_earned})</span></td>
            <td class="text-right">${remaining_ap} <span class="text-danger">(-${mission.ap_cost})</span></td>
          </tr>
      `);

        return false;
      });
    };
  });
});