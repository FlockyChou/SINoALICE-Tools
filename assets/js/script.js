$(function() {
  let chapters;
  let sorted_chapters;
  let filtered_chapters;

  const $form               = $('#experience-form');
  const $tbody              = $('tbody');
  const $current_exp        = $('#current-experience');
  const $max_exp            = $('#max-experience');
  const $ap                 = $('#ap');
  const $chapter_selector   = $('#chapter-selector');

  // Get chapters data from JSON
  $.getJSON('/data/chapters.json', function(data) {
    // Set JSON data to variable
    chapters  = data;
  }).done(function() {
    // These need to be deep cloned or else they are references
    sorted_chapters   = $.extend(true, [], chapters);

    // Sort chapters by experience ratio from highest to lowest
    sorted_chapters = sorted_chapters.sort(function(key_1, key_2) {
      return -(key_1.experience_ratio - key_2.experience_ratio);
    });

    filtered_chapters = $.extend(true, [], sorted_chapters);

    generateChapterSelector(chapters, $chapter_selector);
  });

  $form.submit(function(e) {
    e.preventDefault();

    // Set the remaining EXP and AP that we will want to get down to 0
    let remaining_exp = $max_exp.val() - $current_exp.val();
    let remaining_ap  = $ap.val();

    // Calculate the current EXP/AP ratio
    const user_exp_ratio          = remaining_exp / remaining_ap;
    let closest_exp_ratio_chapter = { "experience_ratio": 1_000_000 };

    // Clear the table
    $tbody.html('');
    insertTableRow($tbody, '<strong>Start</strong>', '-', `<strong>${remaining_exp}</strong>`, `<strong>${remaining_ap}</strong>`);

    filtered_chapters = updateFilteredChapters(sorted_chapters);

    // Find the quest with the closest EXP/AP ratio to the user's current state
    $.each(filtered_chapters, function(index, chapter) {
      // We want the chapters with the lowest experience ratio that is HIGHER than the user's current experience ratio
      if(chapter.experience_ratio >= user_exp_ratio && closest_exp_ratio_chapter.experience_ratio >= chapter.experience_ratio) {
        closest_exp_ratio_chapter = chapter;
      }
    });

    // If we are unable to, the user can't level up easily at this point
    if(closest_exp_ratio_chapter.experience_ratio == 1_000_000) {
      alert('We could not calculate a way for you to level up with these numbers.');
      return true;
    }

    // If they can level up easily, we repeat the chapter that has the closest EXP/AP ratio until the user's AP is about 2x the most efficient chapter
    //
    // TODO: Why 2x? Because magic numbers are cool. In current state, if we don't do this, it will leave some AP unused in most cases,
    //   which isn't a problem but we want to go out with a bang and make sure they level-up since if we're using a lower EXP/AP ratio
    //   for the quest, they will never level-up.
    while(remaining_ap > closest_exp_ratio_chapter.ap_cost * 2 && remaining_exp - closest_exp_ratio_chapter.experience_earned > 0) {
      remaining_exp -= closest_exp_ratio_chapter.experience_earned;
      remaining_ap  -= closest_exp_ratio_chapter.ap_cost;

      insertTableRow(
        $tbody,
        `Act ${closest_exp_ratio_chapter.act}, Chapter ${closest_exp_ratio_chapter.chapter}, ${closest_exp_ratio_chapter.act_difficulty}`,
        closest_exp_ratio_chapter.experience_ratio,
        `${remaining_exp} <span class="text-danger">(-${closest_exp_ratio_chapter.experience_earned})</span>`,
        `${remaining_ap} <span class="text-danger">(-${closest_exp_ratio_chapter.ap_cost})</span>`
      );
    }

    let final_chapter_found = false;

    // See if there is one last chapter with a high exp ratio that can wrap this up
    $.each(filtered_chapters, function(index, chapter) {
      if(chapter.experience_earned >= remaining_exp && chapter.ap_cost <= remaining_ap) {
        remaining_exp -= chapter.experience_earned;
        remaining_ap  -= chapter.ap_cost;

        final_chapter_found = true;

        insertTableRow(
          $tbody,
          `Act ${chapter.act}, Chapter ${chapter.chapter}, ${chapter.act_difficulty}`,
          chapter.experience_ratio,
          `${remaining_exp} <span class="text-danger">(-${chapter.experience_earned})</span>`,
          `${remaining_ap} <span class="text-danger">(-${chapter.ap_cost})</span>`
        );
      }

      // Break out of each loop if final chapter found
      if(final_chapter_found == true) { return false; }
    });
  });
});

function generateChapterKey(difficulty, act, chapter) {
  return `${difficulty}-${act}-${chapter}`;
}

function generateChapterSelector(chapters, chapter_selector) {
  let acts = {}

  $.each(chapters, function(index, chapter) {
    const hash_key    = `${chapter.act_difficulty}-${chapter.act}`;
    const input_index = generateChapterKey(chapter.act_difficulty, chapter.act, chapter.chapter);

    // TODO: Default to true for now until I add cookie support
    const checked_status = true;

    acts[hash_key] = (acts[hash_key] === undefined) ? [] : acts[hash_key];
    acts[hash_key].push(`
      <div class="form-check form-check-inline">
        <input id="chapter-${input_index}" class="chapter-checkbox form-check-input" type="checkbox" value="${input_index}" ${checked_status ? 'checked' : ''}>
        <label class="form-check-label" for="chapter-${input_index}">${chapter.chapter}</label>
      </div>
    `);
  });

  chapter_selector.html('');

  $.each(acts, function(index, act){
    chapter_selector.append(`
      <div class="col">
        <div class="card">
          <div class="card-body">
            <div>
              <label for="${index}">Act ${index}</label>
              <div class="input-group">${act.join(' ')}</div>
            </div>
          </div>
        </div>
      </div>
    `);
  });
};

function insertTableRow(tbody, chapter, exp_ratio, remaining_exp, remaining_ap) {
  tbody.append(`
    <tr>
      <td>${chapter}</td>
      <td class="text-right">${exp_ratio}</td>
      <td class="text-right">${remaining_exp}</td>
      <td class="text-right">${remaining_ap}</td>
    </tr>
  `);
};

function updateFilteredChapters(sorted_chapters) {
  const $chapter_checkboxes = $('.chapter-checkbox');
  let checked_chapters      = [];

  $.each($chapter_checkboxes, function(index, checkbox) {
    const $checkbox  = $(checkbox);
    const is_checked = $checkbox.is(':checked');

    if(is_checked){ checked_chapters.push($checkbox.val()); }
  });

  let filtered_chapters = [];

  $.each(sorted_chapters, function(index, chapter) {
    const chapter_index = generateChapterKey(chapter.act_difficulty, chapter.act, chapter.chapter);

    // $.inArray returns the index of the object so we need to check for a non-negative index for true
    if($.inArray(chapter_index, checked_chapters) >= 0) { filtered_chapters.push(chapter); };
  });

  return filtered_chapters;
}