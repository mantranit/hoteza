var Information = {
	deps: ['SVG'],
	init: function(){
		var d = $.Deferred();
		new LoadTemplates(['modules/Information/information_list.html', 'modules/Information/information_page.html'])
		.done(function(){
			for(var i in structv2.pages) {
				var page = structv2.pages[i];

				//TODO: заменить id в render на page.id
				if (page.type === 'page' && !page.serviceId) {
					var images = [page.image];
					if(isset('config.tv.use_imagewide')){
						images.push(page.imageWide);
					}
					UI.register_page({id: page.id, action: Information.onnavigate, images: images});
					UI.render(i, page, 'information_page', 'white');
				}
				if (page.type === 'list') {
					// перенесено из renderPageOnTheStructv2
					// превращаем объект объектов в массив объектов, т.к. jsRender не перебирает объекты
					page.listItemsArray = objectToArrayList(page.listItems);

					var images = page.listItemsArray.map(function(item){return item.image;});

					if(isset('config.tv.use_imagewide')){
						images.push(page.imageWide);
					}

					if(page.icon){
						page.iconVal = SVG.iconsValue[page.icon];
					}

					UI.register_page({id: page.id, images: images});
					UI.render(i, page, 'information_list');
				}

			}

			//Module init end
			d.resolve();
		});
		return d.promise();
	},
	onnavigate: function(page){
		console.log('nav');
	}
};
