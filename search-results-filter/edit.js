/*** IMPORTS ****************************************************************/

import { __ } from "@wordpress/i18n";
import ServerSideRender from "@wordpress/server-side-render";
import { InspectorControls, useBlockProps } from "@wordpress/block-editor";
import { TextControl, ToggleControl, SelectControl, __experimentalNumberControl as NumberControl, PanelBody } from "@wordpress/components";
import { useSelect } from "@wordpress/data";
import { useEffect, useState } from "@wordpress/element";
import { store as coreDataStore } from "@wordpress/core-data";



/*** FUNCTIONS **************************************************************/

const Controls = (props) => {
	const { attributes, setAttributes } = props;
	const {
		postType,
		listingType,
		subType,
		childTerms,
		perPage,
		title,
		description,
	} = attributes;
	const [catTax, setCatTax] = useState('category');
	let taxonomies = [];

	useEffect(() => {
		setAttributes({ selectedCategory: "" });
		if (postType === "event") {
			setCatTax("eventastic_categories");
		} else {
			setCatTax("category");
		}
	}, [postType]);

	// const taxonomy1 = useSelect(
	// 	(select) =>
	// 		select(coreDataStore).getEntityRecords("taxonomy", "stakeholder_type", {
	// 			type: "stakeholder",
	// 			per_page: 100,
	// 			page: 1,
	// 		}),
	// 	[]
	// );

	// const taxonomy2 = useSelect(
	// 	(select) =>
	// 		select(coreDataStore).getEntityRecords("taxonomy", "stakeholder_type", {
	// 			type: "stakeholder",
	// 			per_page: 100,
	// 			page: 2,
	// 		}),
	// 	[]
	// );

	// if (!!taxonomy1 && !!taxonomy2) {
	// 	const combinedTaxonomies = taxonomy1.concat(taxonomy2);
	// 	taxonomies = combinedTaxonomies;
	// }

	const getChildTerms = (parentID) => {
		let filteredTaxonomies = taxonomies.filter(
			(term) => term.parent == parentID
		);
		let mapTaxonomies = filteredTaxonomies.map((obj) => {
			return { value: obj.id, label: obj.name };
		});
		return mapTaxonomies;
	};

	const cities = useSelect(
		(select) => {
			const query = [
				"taxonomy",
				"eventastic_cities",
				{
					per_page: -1,
				},
			];
			return {
				results: select(coreDataStore).getEntityRecords(...query),
				hasStartedResolution: select(coreDataStore).hasStartedResolution(
					"getEntityRecords",
					query
				),
				hasFinishedResolution: select(coreDataStore).hasFinishedResolution(
					"getEntityRecords",
					query
				),
				isResolving: select(coreDataStore).isResolving(
					"getEntityRecords",
					query
				),
			};
		},
		[attributes.citiesFilter]
	);

	const citiesOptions = cities.results?.map((term) => ({
		value: term.id,
		label: term.name,
	}));

	const categories = useSelect(
		(select) => {
			const query = [
				"taxonomy",
				catTax,
				{
					per_page: -1,
				},
			];
			return {
				results: select(coreDataStore).getEntityRecords(...query),
				hasStartedResolution: select(coreDataStore).hasStartedResolution(
					"getEntityRecords",
					query
				),
				hasFinishedResolution: select(coreDataStore).hasFinishedResolution(
					"getEntityRecords",
					query
				),
				isResolving: select(coreDataStore).isResolving(
					"getEntityRecords",
					query
				),
			};
		},
		[attributes.categoryFilter, catTax]
	);

	const categoryOptions = categories.results?.map((term) => ({
		value: term.id,
		label: term.name,
	}));

	return (
		<InspectorControls>
			<PanelBody title="Block Settings">

				<TextControl
					label={__("Title", "madden-theme")}
					value={title}
					onChange={(val) => {
						setAttributes({ title: val });
					}}
				/>

				<TextControl
					label={__("Description", "madden-theme")}
					value={description}
					onChange={(val) => {
						setAttributes({ description: val });
					}}
				/>

				<NumberControl
					label={__("Items Per Page", "madden-theme")}
					value={perPage}
					step={1}
					min={0}
					onChange={(val) => {
						setAttributes({ perPage: parseInt(val) });
					}}
				/>

				<ToggleControl
					label={__("Display Filters")}
					help={__(
						"Display user-facing filtering options"
					)}
					checked={attributes.displayFilters}
					onChange={() => {
						setAttributes({
							displayFilters: !attributes.displayFilters,
						});
					}}
				/>

				<SelectControl
					label={__("Select Post Type", "madden-theme")}
					value={postType}
					options={[
						{ value: "event", label: "Events" },
						{ value: "post", label: "Posts" },
					]}
					onChange={(val) => {
						setAttributes({ postType: val });
					}}
				/>

				{postType === "event" && (
					<>
						<ToggleControl
							label={__("Filter by City")}
							help={__(
								"This will force filter results by selected cities and hide the frontend city filter"
							)}
							checked={attributes.citiesFilter}
							onChange={() => {
								setAttributes({
									citiesFilter: !attributes.citiesFilter,
								});
							}}
						/>

						{attributes.citiesFilter && (
							<>
								{cities.hasFinishedResolution &&
								cities.results &&
								cities.results.length ? (
									<SelectControl
										label={__("Select cities", "madden-theme")}
										value={attributes.selectedcities}
										options={[
											{ value: "", label: "Select option" },
											...citiesOptions
										]}
										onChange={(val) => {
											setAttributes({ selectedcities: val });
										}}
									/>
								) : (
									<>Loading terms...</>
								)}
							</>
						)}
						<ToggleControl
							label={__("Filter by Date")}
							help={__(
								"This will force filter results by selected dates"
							)}
							checked={attributes.datesFilter}
							onChange={() => {
								setAttributes({
									datesFilter: !attributes.datesFilter,
								});
							}}
						/>

						{attributes.datesFilter && (
							<>
								<SelectControl
									label={__("Select Dates", "madden-theme")}
									value={attributes.selectedDates}
									options={[
										{ value: "", label: __("Select Option") },
										{ value: "week", label: __("This Week") },
										{ value: "month", label: __("This Month") }
									]}
									onChange={(val) => {
										setAttributes({ selectedDates: val });
									}}
								/>
							</>
						)}
					</>
				)}

				<>
					<ToggleControl
						label={__("Filter by Category/Type")}
						help={__(
							"This will force filter results by selected category and hide the frontend category filter"
						)}
						checked={attributes.categoryFilter}
						onChange={() => {
							setAttributes({
								categoryFilter: !attributes.categoryFilter,
							});
						}}
					/>

					{attributes.categoryFilter && (
						<>
							{categories.hasFinishedResolution &&
							categories.results &&
							categories.results.length ? (
								<SelectControl
									label={__("Select Category", "madden-theme")}
									value={attributes.selectedCategory}
									options={[
										{ value: "", label: "Select option" },
										...categoryOptions
									]}
									onChange={(val) => {
										setAttributes({ selectedCategory: val });
									}}
								/>
							) : (
								<>Loading terms...</>
							)}
						</>
					)}
				</>
			</PanelBody>
		</InspectorControls>
	);
};

const Editor = (props) => {
	const blockProps = useBlockProps();
	return (
		<div {...blockProps}>
			<ServerSideRender block={props.name} {...props} />
		</div>
	);
};

const edit = (props) => {
	return (
		<>
			<Controls {...props} />
			<Editor {...props} />
		</>
	);
};



/*** EXPORTS ****************************************************************/

export default edit;