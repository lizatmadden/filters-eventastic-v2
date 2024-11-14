/*** IMPORTS ****************************************************************/

// Local dependencies
import { registerBlockType } from "@wordpress/blocks";
import edit from "./edit";
import save from "./save";
import metadata from "./block.json";

// Styles -- MUST BE IMPORTED IF YOU WANT THEM IN THE BUILD FOLDER.
import "./styles/index.scss";

registerBlockType(metadata, {
	edit,
	save,
});