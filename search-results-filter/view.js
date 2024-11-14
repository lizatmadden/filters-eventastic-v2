import datepicker from "js-datepicker";
import $ from "jquery";
import { THEME_PREFIX } from "scripts/inc/constants";
import "./styles/style.scss";
const { __ } = wp.i18n;

window.addEventListener("DOMContentLoaded", () => {
	initSearchResults();
	filterAccordion();
});

const blockSelector = `.wp-block-${THEME_PREFIX}-search-results-filter`;

function initSearchResults() {

	let blocks = document.querySelectorAll(blockSelector);

	blocks.forEach((block, index) => {
		let loadMoreBtn = block.querySelector(
			".load-more-container .wp-element-button"
		);
		let loadingSpinner = block.querySelector(
			".load-more-container .loading-spinner"
		);
		let searchInput 	= block.querySelector(".filter-search-input .search-input");
		let datePickers 	= block.querySelectorAll("input[type=date].eventasticDatePicker");
		let filterBtns 		= block.querySelectorAll(".filter-select-btn");
		let filterInputs 	= block.querySelectorAll('input[type="radio"]');
		let resultsGrid 	= block.querySelector(".results-grid");
		let clearFilterBtn 	= block.querySelector("#clear-filters-btn");
		let page = 2;
		let perPage = resultsGrid.dataset.perpage;
		let postType = resultsGrid.dataset.posttype;
		let category = resultsGrid.dataset.category ? parseInt(resultsGrid.dataset.category) : false;
		let cities = resultsGrid.dataset.cities ? parseInt(resultsGrid.dataset.cities) : false;
		let filters = {};
		let isLoading = false;
		let isRange = false;
		let catTax = "categories";

		// Icons
		const addressIcon = '<svg id="map-marker" class="event-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 269.83 384"><path d="M144.69,0c3.79,1.15,8.18,1.07,12.16,1.72,33.7,5.47,65.6,24.78,85.97,52.03,81.46,108.98-41.84,238-99.29,326.46l-5.58,3.79h-6l-5.58-3.79C68.95,292.02-54.86,161.89,27.38,53.31,44.94,30.12,71.84,11.91,100.12,4.56L125.19,0h19.5ZM135.67,352.49c25.65-38.92,55.27-75.68,78.14-116.49,27.49-49.03,49.31-104.06,18.47-157.48-42.97-74.45-151.77-74.42-194.71,0-29.32,50.82-11.11,102.74,14.46,150.24,23.44,43.54,54.59,82.36,82.08,123.26l1.55.46Z" fill="#1a2228"/><path d="M128.03,67.72c54.92-5.33,93.28,54.02,64.97,101.72-28.06,47.29-98.86,42.72-120.21-7.92-17.56-41.63,10.17-89.43,55.24-93.8ZM129.52,90.21c-57.34,6.53-49.15,94.8,9.53,89.78,58.91-5.04,50.93-96.67-9.53-89.78Z" fill="#1a2228"/></svg>';

		const clockIcon = '<svg id="clock" class="event-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32.98 32.97"><path d="M32.98,15.7v1.54l-.21,1.82c-1.07,6.84-6.48,12.39-13.3,13.61l-2.07.28c-.6-.02-1.21.03-1.8,0C2.21,32.19-4.86,16.35,3.81,5.95,13.46-5.61,32.17.76,32.98,15.7ZM15.52,1.82C4.8,2.47-1.58,14.26,3.67,23.66s19.68,10.01,25.43.36C35.19,13.81,27.32,1.1,15.52,1.82Z" fill="#1a2228"/><path d="M25.09,15.57c.87.17.91,1.65-.07,1.8h-8.56c-.52-.05-.85-.4-.87-.93V5.64c.09-.69.99-1.01,1.5-.55.08.07.31.47.31.55v9.95h7.69Z" fill="#1a2228"/></svg>';

		// Endpoint is posts not post
		if (postType === 'post') {
			postType = 'posts';
		}

		// Event listeners for filter selection
		filterInputs.forEach((filter) => {
			filter.addEventListener("change", () => {
				applyFilters();
			});
		});

		// Search input listenener with debounce
		searchInput.addEventListener(
			"keyup",
			debounce(() => {
				applyFilters();
			}, 250)
		);

		// Load more button
		loadMoreBtn.addEventListener("click", () => {
			loadMoreBtn.style.display = 'none';
			loadingSpinner.style.display = '';
			applyFilters(false);
		});

		// Clear filters button
		clearFilterBtn.addEventListener("click", () => {
			// Search
			searchInput.value = '';

			// Radios
			filterInputs.forEach(radio => {
				radio.checked = false;
			});

			const allCatsFilter = document.getElementById("all-categories");
			const allCitiesFilter = document.getElementById("all-cities");

			if(allCatsFilter){
				document.getElementById("all-categories").checked = true;
			}
			if(allCitiesFilter){
				document.getElementById("all-cities").checked = true;
			}

			// Date -- See also setupDatePickers()
			datePickers.forEach(datePicker => {
				datePicker.value = '';
			});

			applyFilters();
		});

		// Filter button toggles for mobile
		filterBtns.forEach((btn) => {
			btn.addEventListener("click", () => {
				if (btn.classList.contains("active")) {
					btn.classList.remove("active");
				}
				else {
					filterBtns.forEach((x) => {
						x.classList.remove("active");
					});
					btn.classList.add("active");
				}
			});
		});

		if (postType === "event") {
			catTax = "eventastic_categories";
			setupDatePickers();
		}

		function debounce(func, wait, immediate) {
			let timeout;
			return function () {
				let context = this,
					args = arguments;
				let later = function () {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				let callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		}

		function loadListings() {
			if (isLoading) return;
			isLoading = true;

			let filterString = "?";

			// If query is forced to a specific category vs user filtered
			if (category) {
				filterString += "&" + catTax + "=" + category;
			}
			else if (filters.categories) {
				filterString += "&" + catTax + "=" + filters.categories;
			}

			// If query is forced to a specific cities vs user filtered
			if (cities) {
				filterString += "&eventastic_cities=" + cities;
			}
			else if (filters.cities) {
				filterString += "&eventastic_cities=" + filters.cities;
			}

			if (filters.search) {
				filterString += "&search=" + filters.search;
			}

			if (postType === "event") {
				const endVal = block.querySelector(".filter-date-end #EndDate").value;

				if (isRange) {
					filterString +=
					"&date_filter=true&start_date=" +
					filters.start +
					"&end_date=" +
					filters.end;
				}
				else if(endVal){
					const today = new Date();
					const todayFormatted = today.toLocaleDateString("en-CA"); // YYYY-MM-DD format
					filterString +=
					"&date_filter=true&start_date=" +
					todayFormatted +
					"&end_date=" +
					endVal;
				}
				else {
					filterString += "&date_filter=false";
				}

				filterString += "&event_sort=true";
			}

			filterString += "&_embed";

			filterString = filterString.slice(1);

			let endpoint = "/wp-json/wp/v2/" + postType + "?" + filterString;
			let requestData = {
				page: page,
				per_page: perPage,
				content: "embed"
			};

			if (filters.order) {
				requestData.order = filters.order;
			}

			if (filters.orderBy) {
				requestData.orderby = filters.orderBy;
			}

			$.ajax({
				url: endpoint,
				data: requestData,
				method: "GET",
				beforeSend: function (xhr) {
					// You may need to add authentication headers here if the endpoint requires it
				},
				success: function (listings) {
					if (listings.length > 0) {
						let newListings = [];
						listings.forEach(function (listing, idx) {

							const title = listing.title.rendered;
							const link = listing.link;
							if (postType === "event") {
								var startTime = listing.eventastic.eventastic_start_time;
								var endTime = listing.eventastic.eventastic_end_time;
								endTime = endTime ?  ` &dash; ${endTime}` : '';
								var addrTitle = listing.eventastic.eventastic_addr_multi;
								var addr1 = listing.eventastic.eventastic_addr1;
								var addr2 = listing.eventastic.eventastic_addr2;
								var city = listing.eventastic.eventastic_city;
								var state = listing.eventastic.eventastic_state;
								var zip = listing.eventastic.eventastic_zip;

								// Date data
								let startDateJSON = listing.eventastic.eventastic_start_date;
								let endDateJSON = listing.eventastic.eventastic_end_date;
								let startDateObj = new Date(`${startDateJSON}T00:00:00`);
								let endDateObj = new Date(`${endDateJSON}T00:00:00`);
								const startMonth = startDateObj.getMonth();
								const endMonth = endDateObj.getMonth();
	
								// Date format
								const monthDayFormat = {
									month: 'short',
									day: 'numeric',
									timeZone: 'UTC'
								};
								const dayOnlyFormat = {
									day: 'numeric',
									timeZone: 'UTC'
								};
	
								const endDateFormat = startMonth === endMonth ? dayOnlyFormat : monthDayFormat;
								const startDate = startDateObj.toLocaleDateString('en-US', monthDayFormat);
								const endDate = endDateObj.toLocaleDateString('en-US', endDateFormat);

								// Date display
								// If start and end dates are equal, only show start date
								// If months are equal, but start and end days !equal, show month, start day num, dash, end day num
								// If months are !equal, show month, start day num, dash, end month, end day num
								var date = ((endDateJSON === startDateJSON) || !endDateJSON) ? startDate : `${startDate} &dash; ${endDate}`;
							}

							// Images
							var imgSrc, imgAlt;
							let imgClass = null;

							if(listing.eventastic){
								if(listing.featured_media !== 0 && listing.eventastic.eventastic_featured_img){
									imgSrc 	= listing.eventastic.eventastic_featured_img;
									imgAlt = listing.eventastic.eventastic_featured_img_alt ? listing.eventastic.eventastic_featured_img_alt : listing.title.rendered;
								}
							}
							else if(listing._embedded["wp:featuredmedia"]){
								imgSrc = listing._embedded["wp:featuredmedia"][0].source_url;
								imgAlt = listing._embedded["wp:featuredmedia"][0].alt_text;
							}
							else {
								imgSrc 	= '/wp-content/uploads/sebring_logo_black.svg';
								imgAlt 	= __('Visit Sebring', 'mmk-sebring');
								imgClass = 'class = "fallback-img"';
							}

							imgClass = imgClass ? imgClass : '';

							let listingHTML = "";
							listingHTML += `<article class="grid-item">`;
							listingHTML += `<a href="${link}" title="${title}" class="overlay-link"></a>`;

							if (postType === "event") {
								listingHTML += `<div class="content date">`;
								listingHTML += `<div class="event-date">${date}</div>`;
								listingHTML += `</div>`;
							}

							listingHTML += `<div class="featured-media">`;
							listingHTML += `<img decoding="async" src="${imgSrc}" alt="${imgAlt}" ${imgClass}>`;
							listingHTML += `</div>`;

							listingHTML += `<div class="content">`;

							listingHTML += `<h3 class="post-title">${title}</h3>`;
							if (postType === "event" && startTime) {
								listingHTML += `<p class="time start">${clockIcon} ${startTime}${endTime}</p>`;
							}

							if (postType === "event" && addrTitle || addr1 || addr2 || city && state) {
								listingHTML += `<div class="address">`;
									listingHTML += addressIcon;
									listingHTML += `<div class="address-details">`;
									if (addrTitle) {
										listingHTML += `<p class="address addr-title">${addrTitle}</p>`;
									}
									if (addr1) {
										listingHTML += `<p class="address addr1">${addr1}</p>`;
									}
									if (addr2) {
										listingHTML += `<p class="address addr2">${addr2}</p>`;
									}
									if (city && state) {
										listingHTML += `<p class="address city">${city}, ${state} ${zip}</p>`;
									}
									listingHTML += `</div>`;
								listingHTML += `</div>`;
							}

							listingHTML += `</div>`;
							listingHTML += `<div class="read-more">MORE INFO</div>`;
							listingHTML += `</article>`;

							newListings.push(listingHTML);
						});

						$(resultsGrid).append(newListings);
						loadMoreBtn.style.display = "";
						// Increment page for next pagination
						page++;
					}
					else {
						// No more listings, hide 'load more' button or handle accordingly
						loadMoreBtn.style.display = "none";
						$(resultsGrid).append("<h2>No results found.</h2>");
					}

					if (listings.length < perPage) {
						loadMoreBtn.style.display = "none";
					}

					loadingSpinner.style.display = 'none';
					isLoading = false; // Reset loading flag after request completes
				},
				error: function (err) {
					console.error("Error fetching listings:", err);
					loadingSpinner.style.display = 'none';
					isLoading = false; // Reset loading flag on error
				},
			});
		}

		function applyFilters(remove = true) {
			let filter1 = block.querySelector('input[name="cities"]:checked');
			let filter2 = block.querySelector('input[name="category"]:checked');

			if (filter1) {
				filters.cities = filter1.value;
			}

			if (filter2) {
				filters.categories = filter2.value;
			}

			filters.search = searchInput.value;

			if (isRange) {
				filters.start = block.querySelector(".filter-date-start #StartDate").value;
				filters.end = block.querySelector(".filter-date-end #EndDate").value;

				if(filters.end && !filters.start){
					const today = new Date();
					const todayFormatted = today.toLocaleDateString("en-CA"); // YYYY-MM-DD format
					filters.start = todayFormatted;
				}
			}

			// Filter only logic
			if (remove) {
				page = 1;
				resultsGrid.innerHTML = "";
			}

			loadListings();
		}

		function setupDatePickers() {

			datePickers.forEach((input) => {
				const pickerArgs = {
					id: "event-range-search-picker",
					alwaysShow: true,
					customDays: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
					formatter: (input, date, instance) => {
						const value = date.toISOString().split("T")[0];
						input.value = value;
					},
					onSelect: (instance, date) => {
						isRange = true;
						applyFilters();
					},
				};

				const picker = datepicker(input, pickerArgs);
				clearFilterBtn.addEventListener("click", () => {
					picker.setDate();
				});
			});
		}
	});
}

function filterAccordion() {
	const mainContainer = document.getElementById('main');
	const filterHeader = document.querySelector('.search-header');
	const filterWrapper = document.querySelector('.search-filters');

	filterHeader.addEventListener('click', function() {
		if (window.innerWidth < 980) {
			filterWrapper.classList.toggle('open');
		}
	});

	const resizeObserver = new ResizeObserver(entries => {
		entries.forEach(entry => {
			const width = entry.contentRect.width;

			if (width > 980) {
				filterWrapper.classList.remove('open');
			}
		});
	});

	resizeObserver.observe(mainContainer);
}