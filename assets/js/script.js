$(function() {
  const min_ap = 6;

  let missions;

  $.getJSON('/data/missions.json', function(data) {
    // Set JSON data to variable
    missions = data;
  }).done(function() {
    // Sort missions by experience ratio from highest to lowest
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

    let exp_earned    = 0;
    let ap_used       = 0;

    $tbody.append(`
      <tr>
        <td>Start</td>
        <td class="text-right">-</td>
        <td class="text-right">${remaining_exp}</td>
        <td class="text-right">${remaining_ap}</td>
      </tr>
    `);

    let loops = 100

    while(remaining_exp > 0 && loops > 0) {
      $.each(missions, function(index, mission) {
        // Skip if AP cost is too high
        if(mission.ap_cost > remaining_ap) { return true; }

        // Skip if EXP gain > 25% of the remaining EXP because magic numbers
        if(mission.chapter != 1 && mission.experience_earned >= remaining_exp * 0.25) { return true; }

        let temp_remaining_exp = remaining_exp - mission.experience_earned;
        let temp_remaining_ap  = remaining_ap  - mission.ap_cost;

        // Skip if experience earned is greater than remaining
        if(0 > remaining_exp) { return true; }

        remaining_exp = temp_remaining_exp;
        remaining_ap  = temp_remaining_ap;

        $tbody.append(`
          <tr>
            <td>Act ${mission.act}, Chapter ${mission.chapter}, ${mission.act_difficulty}</td>
            <td class="text-right">${mission.experience_ratio}</td>
            <td class="text-right">${remaining_exp} <span class="text-danger">(-${mission.experience_earned})</span></td>
            <td class="text-right">${remaining_ap} <span class="text-danger">(-${mission.ap_cost})</span></td>
          </tr>
        `);

        exp_earned += mission.experience_earned;
        ap_used    += mission.ap_cost;

        return false;
      });

      loops -= 1;
      console.log(loops);
    };

    $tbody.append(`
      <tr>
        <td><strong>Total</strong></td>
        <td class="text-right">-</td>
        <td class="text-right"><strong>${exp_earned}</strong></td>
        <td class="text-right"><strong>${ap_used}</strong></td>
      </tr>
    `);
  });
});