/**
 * SiteFeature
 * requires MooTools Core 1.2+
 */

var SiteFeature = new Class({

    Implements: Options,

    options: $H({
		autoPlay: false,
		autoPlayInterval: 5000,
        fxDuration: 500,
        fxTransition: 'sine:in',
        navigationOrientation: 'left',
        overlayOpacity: 0.5,
        pauseOnMouseOver: false,
        showLayerOnMouseOverOnly: false,
        trigger: 'click'
    }),

    initialize: function(element, options)
    {
        this.element = $(element);
        if(!this.element)
        {
            return;
        }
        this.setOptions(options);

        this.busy = false;
        this.current = null;
		this.interval = null;
        this.paused = false;

        // Elements
        this.elements = this.element.getChildren('div');

        this.initContent();
        this.initAutoPlay();
    },

	autoPlay: function()
	{
		var next = this.current + 1 < this.elements.length ? this.current + 1 : 0;
		this.toggle(next);
	},
	
	clearAutoPlay: function()
	{
		if(this.interval)
		{
			$clear(this.interval);
		}
	},

    hexToRgb: function(hex)
    {
        var h = hex.contains('#') ? hex.substring(1) : hex;
        var rgb = [];

        for(var i = 0; i < h.length; i+=2)
        {
            rgb.push(parseInt((h).substring(i,(i+2)),16).toInt());
        }

        return rgb;  
    },

	initAutoPlay: function()
	{
		if(this.options.autoPlay)
		{
			var t = this.options.autoPlayInterval < this.options.fxDuration ? this.options.fxDuration : this.options.autoPlayInterval;
			this.interval = this.autoPlay.periodical(t, this);
		}
	},	

    initContent: function()
    {       
        this.element.addClass('initialized');

        this.navigation = new Element('ul').inject(this.element, 'top');

		this.navigation.setStyles({
            left: this.options.navigationOrientation == 'left' ? 0 : this.elements[0].getWidth()
		});

		var trigger = this.options.trigger == 'hover' ? 'mouseover' : this.options.trigger.toLowerCase();

        this.elements.each(function(el, i){
			// create Navigation
            var li = new Element('li').adopt(
				new Element('strong', {
					html: el.getElement('h3').get('html')
				}),
				new Element('span', {
					html: el.getElement('img').get('title')
				})
			).inject(this.navigation);

			el.getElement('img').removeProperty('title');

            li.addEvent(trigger, function(){
				this.toggle(i);
            }.bind(this));

			if(i == 0)
			{
				li.addClass('current first');
			}
    
			// Overlay

            var children = el.getChildren();

            var layer = new Element('div', {
				'class': 'layer'
            }).addClass('layer').inject(el, 'bottom');

            if(!this.options.showLayerOnMouseOverOnly)
            {
                layer.setStyle('left', this.options.navigationOrientation == 'left' ? el.getWidth() - layer.getWidth() : 0);
            }
            else
            {
                layer.setStyle('left', this.options.navigationOrientation == 'left' ? el.getWidth() : (layer.getWidth()*-1));

                el.addEvents({
                    'mouseleave': this.toggleLayer.bindWithEvent(this, [layer, 0]),
                    'mouseenter': this.toggleLayer.bindWithEvent(this, [layer, 1])
                });
            }

            layer.store('fxInstance', new Fx.Tween(layer, {
                duration: this.options.fxDuration,
                transition: this.options.fxTransition
            }));

            children.each(function(el, i){
				if(i > 0)
				{
					layer.grab(el);
				}
            });

            this.rgba(layer);
        }, this);

        this.elements.each(function(el, i){
            el.setStyles({
				left: this.options.navigationOrientation == 'left' ? this.navigation.getWidth() : 0,
                opacity: i > 0 ? 0 : 1,
                zIndex: i > 0 ? 0 : 1
            });
        }, this);

		this.current = 0;
		this.positions = {
			minimized: this.options.navigationOrientation == 'left' ? this.elements[0].getWidth() : (this.elements[0].getElement('div').getWidth()*-1),
			maximized: this.options.navigationOrientation == 'left' ? this.elements[0].getWidth() - this.elements[0].getElement('div').getWidth() : 0
		};

        if(this.options.pauseOnMouseOver)
        {
            this.element.addEvents({
                'mouseenter': this.pause.bindWithEvent(this),
                'mouseleave': this.resume.bindWithEvent(this)
            });
        }
    },
    
    pause: function()
    {
        if(this.options.pauseOnMouseOver && this.interval)
        {
            this.clearAutoPlay();
            this.paused = true;
        }
    },
    
    resume: function()
    {
        if(this.paused)
        {
            this.initAutoPlay();
            this.paused = false;
        }
    },
    
    rgba: function(el)
    {
        $splat(el).each(function(el){

            var s = el.getStyles('backgroundColor','paddingLeft','paddingRight');

            if(this.testRGBA(el))
            {
                var rgba = this.hexToRgb(s.backgroundColor);
                rgba.push(this.options.overlayOpacity);

                el.setStyle('backgroundColor', 'rgba('+rgba.join(',')+')');
                return;
            }

            var styles = $H(el.getCoordinates()).extend({
                color: s.backgroundColor,
                opacity: this.options.overlayOpacity,
                paddingLeft: s.paddingLeft.toInt(),
                paddingRight: s.paddingRight.toInt()
            });
            styles.extend({
                'realWidth': styles.width - styles.paddingLeft - styles.paddingRight
            });
            var children = el.getChildren();
            
            var classes = el.get('class');
            el.removeProperty('class');

			// background
            var bg = new Element('div', {
                styles: {
                    backgroundColor: styles.color,
                    height: styles.height,
                    left: 0,
                    opacity: styles.opacity,
                    position: 'absolute',
                    top: 0,
                    width: styles.width,
                    zIndex: 0
                }    
            });

			// content
            var childHolder = new Element('div', {
                'class': classes
            }).adopt(children).setStyles({
                backgroundColor: 'transparent',
                height: styles.height,
                left: 0,
                position: 'absolute',
                top: 0,
                width: styles.realWidth,
                zIndex: 1
            });
            
            var holder = new Element('div', {
                styles: {
                    backgroundColor: 'transparent',
                    height: styles.height,
                    position: 'relative',
                    width: styles.width
                }    
            }).adopt(bg, childHolder);
            
            el.adopt(holder).setStyles({
                backgroundColor: 'transparent',
				width: styles.width
            });

        }, this);

    },

    testRGBA: function(el)
    {
        // Set an rgba() color and check the returned value        
		try {
			this.element.setStyle('backgroundColor', 'rgba(10,10,10,0.5)');
		} catch(e) {};

        var rgba = this.element.getStyle('backgroundColor').contains('rgba');

		this.element.setStyle('backgroundColor', 'transparent');

		return rgba;
    },

	toggle: function(i)
    {
        if(i == this.current || this.busy)
        {
            return;
        }
        this.busy = true;
		this.clearAutoPlay();

		var currentEl = this.elements[this.current];
		var nextEl = this.elements[i];

		var lis = this.navigation.getElements('li');
		lis[this.current].removeClass('current');
		lis[i].addClass('current');

        nextEl.setStyle('z-index', 2);
		nextEl.getElement('div').setStyle('left', this.positions.minimized);
		
		// hidecontent // overlay
        if(!this.options.showLayerOnMouseOverOnly)
        {
            this.toggleLayer(0, currentEl.getElement('div'), 0);
        }

		// show content
        if(!this.options.showLayerOnMouseOverOnly)
        {
            this.toggleLayer(0, nextEl.getElement('div'), 1);
        }

		new Fx.Tween(nextEl, {
			duration: this.options.fxDuration,
			transition: this.options.fxTransition
		}).start('opacity', 1).chain(function(){
			currentEl.setStyles({
				opacity: 0,
				zIndex: 0
			});
			nextEl.setStyle('z-index', 1);

			this.busy = false;
			this.current = i;

			this.initAutoPlay();			
		}.bind(this));
    },
    
    toggleLayer: function(e, layer, maximize)
    {
        layer.retrieve('fxInstance').pause().start('left', maximize ? this.positions.maximized : this.positions.minimized);
    }
	
});