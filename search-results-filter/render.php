<?php
namespace MaddenNino\Blocks\SearchResultsFilter;
use MaddenNino\Library\Constants as Constants;
use WP_Query;

/**
 * Render function for the dynamic example block
 * @param array $attributes        all block attributes
 * @param string $content
 */

$attrs = $attributes;
$hideLoadMore = false;

// City tax select
$citiesTaxFilter = false;
if ($attrs['citiesFilter']) {
	if ($attrs['selectedcities'] !== "") {
		$citiesTaxFilter = true;
	}
}

// Category tax select
$categoryTaxFilter = false;
if ($attrs['categoryFilter']) {
	if ($attrs['selectedCategory'] !== "") {
		$categoryTaxFilter = true;
	}
}

$taxonomy_category = 'category';

$mainTax      = '';
$subType      = '';
$term_title   = '';
$toplevel     = false;
$end_date     = '';

// Eventastic
if ($attrs['postType'] === 'event') {

	// Taxonomies
	$taxonomy_category = 'eventastic_categories';
	$taxonomy_cities  = 'eventastic_cities'; //Custom taxonomy

	// Month and Week view date formats
	if ($attrs['datesFilter'] && $attrs['selectedDates']){

		$today = new \DateTime();

		switch ($attrs['selectedDates'] ){
			case 'week':
				$oneWeekFromToday = clone $today;
				$end_date = $oneWeekFromToday->modify('+1 week')->format('Y-m-d');
				break;
			case 'month':
				$oneMonthFromToday = clone $today;
				$end_date = $oneMonthFromToday->modify('+1 month')->format('Y-m-d');
				break;
			default:
				$end_date = '';
				break;
		}
	}
}

// Get terms for cities taxonomy
$cities_terms = get_terms(array(
	'taxonomy' => $taxonomy_cities,
	'hide_empty' => false
));

// Get terms for Categories taxonomy
$category_terms = get_terms(array(
	'taxonomy' => $taxonomy_category,
	'hide_empty' => false
));

$wrapper_attributes = get_block_wrapper_attributes();

// Icons
$filter_arrow = '<svg class="filter-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" fill="#1A2228"/></svg>';

$clock_icon = '<svg id="clock" class="event-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32.98 32.97"><path d="M32.98,15.7v1.54l-.21,1.82c-1.07,6.84-6.48,12.39-13.3,13.61l-2.07.28c-.6-.02-1.21.03-1.8,0C2.21,32.19-4.86,16.35,3.81,5.95,13.46-5.61,32.17.76,32.98,15.7ZM15.52,1.82C4.8,2.47-1.58,14.26,3.67,23.66s19.68,10.01,25.43.36C35.19,13.81,27.32,1.1,15.52,1.82Z" fill="#1a2228"/><path d="M25.09,15.57c.87.17.91,1.65-.07,1.8h-8.56c-.52-.05-.85-.4-.87-.93V5.64c.09-.69.99-1.01,1.5-.55.08.07.31.47.31.55v9.95h7.69Z" fill="#1a2228"/></svg>';

$address_icon = '<svg id="map-marker" class="event-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 269.83 384"><path d="M144.69,0c3.79,1.15,8.18,1.07,12.16,1.72,33.7,5.47,65.6,24.78,85.97,52.03,81.46,108.98-41.84,238-99.29,326.46l-5.58,3.79h-6l-5.58-3.79C68.95,292.02-54.86,161.89,27.38,53.31,44.94,30.12,71.84,11.91,100.12,4.56L125.19,0h19.5ZM135.67,352.49c25.65-38.92,55.27-75.68,78.14-116.49,27.49-49.03,49.31-104.06,18.47-157.48-42.97-74.45-151.77-74.42-194.71,0-29.32,50.82-11.11,102.74,14.46,150.24,23.44,43.54,54.59,82.36,82.08,123.26l1.55.46Z" fill="#1a2228"/><path d="M128.03,67.72c54.92-5.33,93.28,54.02,64.97,101.72-28.06,47.29-98.86,42.72-120.21-7.92-17.56-41.63,10.17-89.43,55.24-93.8ZM129.52,90.21c-57.34,6.53-49.15,94.8,9.53,89.78,58.91-5.04,50.93-96.67-9.53-89.78Z" fill="#1a2228"/></svg>';
?>

<section <?php echo $wrapper_attributes; ?>>

	<?php if ($attrs['displayFilters']) { ?>
	<div class="search-filters">

		<?php if ($attrs['title'] || $attrs['description']) { ?>
		<div class="search-header">
			<?php
				if ($attrs['title']) {
					echo '<h2>'.$attrs['title'].'</h2>';
				}
				if ($attrs['description']) {
					echo '<p>'.$attrs['description'].'</p>';
				}
			?>
		</div>
		<?php } ?>

		<div class="search-inputs">
			<div class="filter-search-input">
				<label><span>Search</span>
					<input type="text" class="filter search-input" placeholder="Search"/>
				</label>
			</div>

			<div class="filter-dropdowns">

				<?php if ($attrs['postType'] === 'event') { ?>
					<!-- Start Date -->
					<div class="filter filter-date-start">
						<button class="filter-select-btn">
							<?php _e("Start Date", "mmk-sebring");?>
							<?php echo $filter_arrow;?>
						</button>
						<div class="filter-select-content">
							<input id="StartDate" maxlength="10" name="start_date" readonly="true" type="date" value="" class="eventasticDatePicker hasDatepicker">
						</div>
					</div>

					<!-- End Date -->
					<div class="filter filter-date-end">
						<button class="filter-select-btn">
							<?php _e("End Date", "mmk-sebring");?>
							<?php echo $filter_arrow;?>
						</button>
						<div class="filter-select-content">
							<input id="EndDate" maxlength="10" name="end_date" readonly="true" type="date" value="<?php esc_attr_e($end_date); ?>" class="eventasticDatePicker hasDatepicker">
						</div>
					</div>
				<?php } ?>

				<?php if ($attrs['postType'] === 'event' && !$citiesTaxFilter) { ?>
					<!-- Cities -->
					<div class="filter filter-cities">
						<button class="filter-select-btn">
							<?php _e("Cities", "mmk-sebring");?>
							<?php echo $filter_arrow;?>
						</button>
						<div class="filter-select-content">
							<label><input type="radio" name="cities" value="" id="all-cities" checked> All Cities</label>
							<?php foreach ($cities_terms as $term): ?>
							<label><input type="radio" name="cities" value="<?php echo esc_attr($term->term_id); ?>"><?php echo esc_html($term->name); ?></label>
							<?php endforeach; ?>
						</div>
					</div>
				<?php } ?>

				<?php if (!$categoryTaxFilter && (empty($attrs['subType']))) { ?>
					<!-- Categories -->
					<div class="filter filter-categories">
						<button class="filter-select-btn">
							<?php _e("Categories", "mmk-sebring");?>
							<?php echo $filter_arrow;?>
						</button>
						<div class="filter-select-content">
							<label>
								<input type="radio" name="category" value="" id="all-categories" checked /> All Categories
							</label>
							<?php
							if ($category_terms) {
								foreach ($category_terms as $term) {
									?>
									<label>
										<input type="radio" name="category" value="<?php echo esc_attr($term->term_id); ?>" />
										<?php echo esc_html($term->name); ?>
									</label>
								<?php
								}
							}
							?>
						</div>
					</div>
				<?php } ?>

				<!-- Clear button -->
				<div class="clear-filters">
					<?php echo do_blocks('<!-- wp:buttons {"className":"center-on-mobile","layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons center-on-mobile"><!-- wp:button {"className":"is-style-outline has-header-font-family has-medium-font-size has-custom-width wp-block-button__width-100 has-custom-font-size"} --><div class="wp-block-button is-style-outline has-header-font-family has-medium-font-size has-custom-font-size has-custom-width wp-block-button__width-100"><a class="wp-block-button__link wp-element-button has-border-color has-medium-blue-border-color" id="clear-filters-btn">CLEAR FILTERS</a></div><!-- /wp:button --></div><!-- /wp:buttons -->'); ?>
				</div>
			</div>
		</div>
	</div>
	<?php } ?>

	<div class="results-wrapper">
		<div class="search-results">
			<div class="results-grid" data-perpage="<?php echo $attrs['perPage']; ?>" data-posttype="<?php echo $attrs['postType']; ?>" data-maintax="<?php echo $mainTax; ?>" data-subtype="<?php echo $subType; ?>" data-cities="<?php echo $citiesTaxFilter ? $attrs['selectedcities'] : null; ?>" data-category="<?php echo $categoryTaxFilter ? $attrs['selectedCategory'] : ''; ?>">

				<?php
				$args = array(
					'post_type' => $attrs['postType'],
					'posts_per_page' => $attrs['perPage'],
					'orderby' => 'date',
					'order' => 'DESC',
				);

				$args['tax_query'] = array();

				if ($attrs['postType'] === 'event') {

					$args['order'] = 'ASC';
					$args['orderby'] = 'meta_value';
					$args['meta_key'] = 'eventastic_start_date';

					// Start grid on todays date
					$args['meta_query'] = array(
						array(
							'key'     => 'eventastic_start_date',
							'value'   => date('Y-m-d'),
							'compare' => '>=',
							'type'    => 'DATE'
						)
					);

					// Month and Week views
					if ($attrs['datesFilter'] && $attrs['selectedDates']){
						array_push($args['meta_query'], array(
							array(
								'key'     => 'eventastic_end_date',
								'value'   => $end_date,
								'compare' => '<=',
								'type'    => 'DATE'
							)
						));
					}
				}

				// Cities
				if ($citiesTaxFilter) {
					array_push($args['tax_query'], array(
							'taxonomy' => 'eventastic_cities',
							'terms' => $attrs['selectedcities']
					));
				}

				// Categories
				if ($categoryTaxFilter) {
					array_push($args['tax_query'], array(
						'taxonomy' => $taxonomy_category,
						'terms' => $attrs['selectedCategory']
					));
				}

				$query = new WP_Query($args);

				$i = 1;
				if ($query->have_posts()) {
					while ($query->have_posts()) {
						$query->the_post();
						$id     = get_the_ID();
						$title  = get_the_title();
						$link   = get_permalink();
						$image  = get_the_post_thumbnail($id, 'large');

						// Fallback image
						if (!$image) {
							$image = '<img src="/wp-content/uploads/sebring_logo_black.svg" class="fallback-img">';
						}

						// Eventastic
						if ($attrs['postType'] === 'event') {
							// Start Date
							$event_start_meta = get_post_meta($id, 'eventastic_start_date', true);
							$event_start_date = new \DateTimeImmutable($event_start_meta);
							$event_start = $event_start_date->format('M j');
							$event_start_month = $event_start_date->format('M');

							// End Date
							$event_end_meta = get_post_meta($id, 'eventastic_end_date', true);
							$event_end_date = new \DateTimeImmutable($event_end_meta);
							$event_end = $event_end_date->format('j');
							$event_end_month = $event_end_date->format('M');

							// Format Dates
							if($event_start_month !== $event_end_month) {
								$event_end = $event_end_date->format('M d');
							}

							$event_date_arr = array($event_start, $event_end);
							$event_date = ($event_start_meta === $event_end_meta) ? $event_start : implode(' &dash; ', $event_date_arr);

							// Times
							$event_start_time = get_post_meta($id, 'eventastic_start_time', true);
							$event_end_time = get_post_meta($id, 'eventastic_end_time', true);
							$event_time_arr = array($event_start_time, $event_end_time);
							$event_time = (($event_start_time === $event_end_time) || empty($event_end_time)) ? $event_start_time : implode(' &dash; ', $event_time_arr);

							// Location
							$event_addr_title = get_post_meta($id, 'eventastic_addr_multi', true);
							$event_addr1 = get_post_meta($id, 'eventastic_addr1', true);
							$event_addr2 = get_post_meta($id, 'eventastic_addr2', true);
							$event_city = get_post_meta($id, 'eventastic_city', true);
							$event_city =  $event_city ?: '';
							$event_state = get_post_meta($id, 'eventastic_state', true);
							$event_state = $event_state ? ', ' . $event_state : '';
							$event_zip = get_post_meta($id, 'eventastic_zip', true);
							$event_zip = $event_zip ? ' ' . $event_zip : '';
							$event_addr3 = $event_city . $event_state . $event_zip;
						}

						// Posts
						if ($toplevel || $attrs['postType'] === 'post') {
							$terms = wp_get_post_terms($id, $taxonomy_category);
							$deepestTerm = false;
							$maxDepth = -1;
							foreach ($terms as $term) {
								$ancestors = get_ancestors($term->term_id, $taxonomy_category);
								$termDepth = count($ancestors);

								if ($termDepth > $maxDepth) {
									$deepestTerm = $term;
									$maxDepth = $termDepth;
								}
							}
							$term_title = $deepestTerm->name;
						}

						// Generate HTML for each post
						$listingHTML = '<article class="grid-item">';
						$listingHTML .= '<a href="' . $link . '" title="'.$title.'" class="overlay-link"></a>';

						// Dates
						if ($attrs['postType'] === 'event') {
							$listingHTML .= '<div class="content date">';
							$listingHTML .= '<p class="event-date">' . $event_date . '</p>';
							$listingHTML .= '</div>';
						}

						// Image, content, title
						$listingHTML .= '<div class="featured-media">' . $image . '</div>';
						$listingHTML .= '<div class="content main">';
						$listingHTML .= '<h3 class="post-title">' . $title . '</h3>';

						// Eventastic time, location
						if ($attrs['postType'] === 'event') {
							if ($event_start_time) {
								$listingHTML .= '<p class="time">' . $clock_icon . $event_time . '</p>';
							}
							if ($event_addr_title || $event_addr1 || $event_addr2 || $event_city && $event_state) {
								$listingHTML .= '<div class="address">';
									$listingHTML .= $address_icon;
									$listingHTML .= '<div class="address-details">';
										$listingHTML .= $event_addr_title ? '<p class="addr-title">' . $event_addr_title . '</p>' : null;
										$listingHTML .= $event_addr1 ? '<p class="addr1">' . $event_addr1 . '</p>' : null;
										$listingHTML .= $event_addr2 ? '<p class="addr2">' . $event_addr2 . '</p>' : null;
										$listingHTML .= ($event_city || $event_state || $event_zip) ? '<p class="city">' . $event_addr3 . '</p>' : null;
									$listingHTML .= '</div>';
								$listingHTML .= '</div>';
							}
						}

						// Read more, close node
						$listingHTML .= '</div>';
						$listingHTML .= '<div class="read-more">MORE INFO</div>';
						$listingHTML .= '</article>';

						// Output the generated HTML
						echo $listingHTML;
						$i++;
					}

					// Restore original post data
					wp_reset_postdata();
				}
				else {
						// No posts found
						echo '<h2>No results found.</h2>';
				}

				if ($query->found_posts <= $attrs['perPage']) {
					$hideLoadMore = true;
				}
				?>
			</div>
		</div>

		<div class="load-more-container" <?= $hideLoadMore ? 'style="display:none;"' : ""; ?>>
			<?php echo do_blocks('<!-- wp:buttons {"className":"center-on-mobile","layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons center-on-mobile"><!-- wp:button {"className":"is-style-outline has-header-font-family has-medium-font-size has-custom-width wp-block-button__width-100 has-custom-font-size"} --><div class="wp-block-button is-style-outline has-header-font-family has-medium-font-size has-custom-font-size"><a class="wp-block-button__link wp-element-button has-border-color has-medium-blue-border-color">LOAD MORE</a><span class="loading-spinner" style="display: none;"><span></span></span></div><!-- /wp:button --></div><!-- /wp:buttons -->'); ?>
		</div>
	</div>
</section>