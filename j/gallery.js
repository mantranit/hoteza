function Gallery(container) {
	var self = this;

	self.fullScreen = parseInt(container.dataset.fullScreen);

	self.show = function(that) {
		self.img = that;
		self.container = $(that).closest('.page');
		var img = new Image();
		img.src = $(that).attr('src');

		img.onload = function() {
			self.renderWrap();
			$('.gallery_wrap_img img').remove();
			self.wrap.appendChild(this);

			self._resize.call(this);

			$('.gallery_subContainer').css('display', 'block');
			self.wrap.style.marginTop = - (self.wrap.clientHeight/2) + 'px';
			self.wrap.style.marginLeft = - (self.wrap.clientWidth/2) + 'px';

			self.list = that.parentNode.parentNode.querySelectorAll('img');
			tv_keydown_override = self._server_keydown;
		};
	};
	self.left = function() {
		self.hidden();
		tv_left();
		tv_ok();
	};
	self.right = function() {
		self.hidden();
		tv_right();
		tv_ok();
	};
	self.close = function() {
		tv_keydown_override = null;

		var gallery_subContainer = $('.gallery_subContainer'),
			id = gallery_subContainer.attr('id');

		gallery_subContainer.remove();

		if (self.fullScreen) {
			tv_back();
		}
		else {
			navigate("#" + id);
		}

	};
	self.hidden = function() {
		navigate("#" + $('.gallery_subContainer').attr('id'));
	};
	self.renderWrap = function() {
		if ($('.gallery_subContainer').length) {
			self.subContainer = document.querySelector('.gallery_subContainer');
			self.wrap = document.querySelector('.gallery_wrap_img');
			self.subContainer.id = self.container.attr('id');
			return;
		}

		self.subContainer = document.createElement('div');
		self.subContainer.classList.add('gallery_subContainer');
		self.subContainer.id = self.container.attr('id');

		self.wrap = document.createElement('div');
		self.wrap.classList.add('gallery_wrap_img');

		self.btn = document.createElement('div');
		self.btn.classList.add('btn');
		self.btn.setAttribute('onvclick', 'gallery.close()');
		self.btn.style.display = 'none';

		self.wrap.appendChild(self.btn);
		self.subContainer.appendChild(self.wrap);
		document.body.appendChild(self.subContainer);
	};
	self._resize = function() {
		var margin = 20,
			max_width = 1280 - margin,
			max_height = 720 - margin,
			coef = this.width/this.height,
			width, height;

		if(this.width > max_width || this.height > max_height){
			width = Math.min(max_width, max_height*coef);
			height = Math.min(max_height, max_width/coef);
		}else{
			width = this.width;
			height = this.height;
		}

		self.wrap.style.width = width + margin + 'px';
		self.wrap.style.height = height + margin + 'px';
		this.style.width = width + 'px';
		this.style.height = height + 'px';

	};
	self._server_keydown = function(e) {
		if (!e) e = event;
		var code = (e.keyCode ? e.keyCode : e.which);

		switch (code) {
			case tv_keys.ENTER:
				gallery.close();
				break;
			case tv_keys.LEFT:
				gallery.left();
				break;
			case tv_keys.RIGHT:
				gallery.right();
				break;
			case tv_keys.PORTAL:
			case tv_keys.GUIDE:
			case tv_keys.Q_MENU:
			case tv_keys.MENU:
			case tv_keys.HOME:
				gallery.close();
				navigate('#menu');
				break;
			case tv_keys.EXIT:
			case tv_keys.BACK:
				gallery.close();
				break;
		}
	};
}

function gallery_test(){
	$.getJSON('modules/Tests/gallery_test.json')
	.done(function(d){
		renderPageOnTheStructv2(d.id, d, 'gallery', 'gallery_page');
		var page_id = '#' + d.id;
		new PreloadMedia(page_id)
		.done(function(){
			navigate(page_id);
			$('#' + d.id + ' .gallery_container IMG').on(event_link, function(){
				gallery = new Gallery(this.closest('.gallery_container'));
				gallery.show(this);
			});
		});
	});
}