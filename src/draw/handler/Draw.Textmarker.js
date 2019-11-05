/**
 * @class L.Draw.Textmarker
 * @aka Draw.Textmarker
 * @inherits L.Draw.Feature
 */
L.Draw.Textmarker = L.Draw.Feature.extend({
	statics: {
		TYPE: 'textmarker'
	},

	options: {
		icon: new L.Icon.Default(),
		repeatMode: false,
		zIndexOffset: 2000 // This should be > than the highest z-index any textmarkers
	},

	// @method initialize(): void
	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Textmarker.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.textmarker.tooltip.start;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	// @method addHooks(): void
	// Add listener hooks to this handler.
	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);

		if (this._map) {
			this._tooltip.updateContent({text: this._initialLabelText});

			// Same mouseTextmarker as in Draw.Polyline
			if (!this._mouseTextmarker) {
				this._mouseTextmarker = L.marker(this._map.getCenter(), {
					icon: L.divIcon({
						className: 'leaflet-mouse-textmarker',
						iconAnchor: [20, 20],
						iconSize: [40, 40]
					}),
					opacity: 0,
					zIndexOffset: this.options.zIndexOffset
				});
			}

			this._mouseTextmarker
				.on('click', this._onClick, this)
				.addTo(this._map);

			this._map.on('mousemove', this._onMouseMove, this);
			this._map.on('click', this._onTouch, this);
		}
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler.
	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);

		if (this._map) {
			this._map
				.off('click', this._onClick, this)
				.off('click', this._onTouch, this);
			if (this._textmarker) {
				this._textmarker.off('click', this._onClick, this);
				this._map
					.removeLayer(this._textmarker);
				delete this._textmarker;
			}

			this._mouseTextmarker.off('click', this._onClick, this);
			this._map.removeLayer(this._mouseTextmarker);
			delete this._mouseTextmarker;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng;

		this._tooltip.updatePosition(latlng);
		this._mouseTextmarker.setLatLng(latlng);

		if (!this._textmarker) {
			this._textmarker = this._createTextmarker(latlng);
			// Bind to both textmarker and map to make sure we get the click event.
			this._textmarker.on('click', this._onClick, this);
			this._map
				.on('click', this._onClick, this)
				.addLayer(this._textmarker);
		} else {
			latlng = this._mouseTextmarker.getLatLng();
			this._textmarker.setLatLng(latlng);
		}
	},

	_createTextmarker: function (latlng) {
		var input = window.prompt("", "");
		var text = this._escapeHtml(input);

		var ticon = L.divIcon({
			iconSize: null,
			html: '<div class="map-label"><div class="map-label-content">' + text + '</div><div class="map-label-arrow"></div></div>'
		});
		return new L.Marker(latlng, {
			icon: ticon,
			zIndexOffset: this.options.zIndexOffset
		});
	},

	_onClick: function () {
		this._fireCreatedEvent();

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	_onTouch: function (e) {
		// called on click & tap, only really does any thing on tap
		this._onMouseMove(e); // creates & places textmarker
		this._onClick(); // permanently places textmarker & ends interaction
	},

	_fireCreatedEvent: function () {
		var input = window.prompt("", "");
		var text = this._escapeHtml(input);

		var ticon = L.divIcon({
			iconSize: null,
			html: '<div class="map-label"><div class="map-label-content">' + text + '</div><div class="map-label-arrow"></div></div>'
		});
		var textmarker = new L.Marker.Touch(this._textmarker.getLatLng(), {icon: ticon});
		L.Draw.Feature.prototype._fireCreatedEvent.call(this, textmarker);
	},

	_escapeHtml(unsafe) {
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}
});
