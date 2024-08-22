/**
 * Чтобы обеспечить работу нового блока надо:
 * 1. Добавить данные в Params
 * 2. Добавить данные в Get.items
 * 3. Создать template item'a
 * 4. Добавить data-id в template item'a
 * 5. Проверить, что отдает ф-ия getData в VS.render
 *
 * ... Применять VirtualScroll.set где требуется
 * */

(function () {

	var Params = {
		tv_channellist: {
			WIDTH: 152,
			HEIGHT: 86,
			MARGIN_RIGHT: 35,
			MARGIN_BOTTOM: 76,
			VISIBLE_AREA: 486,
			COLUMNS: 4
		},
		VODcategory: {
			WIDTH: 185,
			HEIGHT: 337,
			MARGIN_RIGHT: 30,
			MARGIN_BOTTOM: 40,
			VISIBLE_AREA: 453,
			COLUMNS: 4
		}
	};

	var Get = {
		/**
		 * @param {string} id - id страницы
		 * @param {boolean} [isIndex] - true === возвращаем индексы эл-тов в массиве
		 *                            false === возвращаем массив с данными эл-тов
		 * @returns {array} - isIndex === true ?
		 *     [{
		 *       indexOfList: {number}, - индекс в основном массиве, для получения данных в VS.render
				 indexOfFiltratedList: {number} - индекс в отфильтрованном массиве, для расчета положения эл-та
			}]
		* */
		items: function(id, isIndex) {
			var items = [],
				filteringItems = getFilteringItems(id);

			if (!isIndex) {
				return filteringItems;
			}

			for (var i = 0, count = 0; i < filteringItems.length; i++) {
				var item = filteringItems[i];
				if (item.state === 'show') {
					items.push(getIndexes());
					count++;
				}
			}

			return items;

			function getIndexes() {
				return {
					indexOfList: i,
					indexOfFiltratedList: count
				};
			}
			function getFilteringItems(id) {
				switch (id) {
					case 'tv_mosaic':
						return _tv_channels;

					case 'VODcategory':
						return VOD.structure.films;
				}
			}
		},
		/**
		 * @param {array} items - массив отфильтрованных эл-тов
		 * */
		visibleItems: function(items) {
			var visibleArea = Get.visibleArea(),
				visibleItems = [];

			for (var i = 0; i < items.length; i++) {
				var item = items[i],
					position = Get.itemPosition(i);

				if (
					visibleArea.from <= position.top &&
					visibleArea.to > position.top
				) {
					visibleItems.push(item);
				}

				if (visibleArea.to <= position.top) {
					break;
				}
			}

			return visibleItems;
		},
		currentItem: function (blockType) {
			if (blockType !== tv_cur_block) {
				return null;
			}

			var id = tv_cur_elem.attr('data-id');
			return typeof id !== 'undefined' ? id : null;
		},
		/**
		 * @param {number} index - indexOfFiltratedList, см. Get.items
		 * */
		itemPosition: function(index) {
			return {
				top: getIndex(index, 'top') * (VirtualScroll.Sizes.HEIGHT + VirtualScroll.Sizes.MARGIN_BOTTOM),
				left: getIndex(index, 'left') * (VirtualScroll.Sizes.WIDTH + VirtualScroll.Sizes.MARGIN_RIGHT)
			};

			function getIndex(index, side) {
				if (side === 'top') {
					return Math.floor(index / VirtualScroll.Sizes.COLUMNS);
				}

				return index < VirtualScroll.Sizes.COLUMNS ? index : index % VirtualScroll.Sizes.COLUMNS;
			}
		},
		visibleArea: function() {
			var offset = Math.abs(
				parseInt(
					(
						VirtualScroll.page.querySelector('.content')
							.style
							.top || 0
					)
				)
			),
				extraLine = VirtualScroll.Sizes.HEIGHT + VirtualScroll.Sizes.MARGIN_BOTTOM;

			return {
				// используем магический сдвиг = 1
				// так как при масштабировании в браузере
				// размеры изменяются
				from: offset - extraLine - (appUseZoom ? 1 : 0),
				to: offset + VirtualScroll.Sizes.VISIBLE_AREA + extraLine
			};
		},
		heightArea: function (id) {
			var items = Get.items(id, true),
				position = Get.itemPosition(items.length - 1);

			return position.top + VirtualScroll.Sizes.HEIGHT + VirtualScroll.Sizes.MARGIN_BOTTOM;
		}
	};

	window.VirtualScroll = {
		deps: [],
		page: null,
		Pages: {},
		Sizes: null,
		init: function () {},
		/**
		 * Скроллим страницу до требуемого эл-та
		 * @param {string} id - id страницы
		 * @param {string} blockType - tv_cur_block
		 * @param {number} targetIndex - целевой индекс. Индекс в основном массиве данных
		 * @param {number} [shift] - сдвиг
		 * */
		scrollTo: function (id, blockType, targetIndex, shift) {
			var items = Get.items(id, true),
				indexOfPosition = null;

			shift = shift ? shift : 0;

			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				if (item.indexOfList === targetIndex) {
					indexOfPosition = i;
					break;
				}
			}

			if (!indexOfPosition && indexOfPosition !== 0) {
				return false;
			}

			var position = Get.itemPosition(indexOfPosition),
				top = position.top - shift;

			top = top < 0 ? position.top : top;
			VirtualScroll.page.querySelector('.content').style.top = - top + 'px';

			move_scroll(- top, blockType);

			VirtualScroll.set(id, blockType, true);

			return true;
		},
		get: function (id) {
			var items = Get.items(id, true);
			return Get.visibleItems(items);
		},
		/**
		 * @param {string} id - id страницы
		 * @param {string} blockType - tv_cur_block, для доступа к данным Params
		 * @param {boolean} [refresh] - true - обновить обязательно
		 * */
		set: function (id, blockType, refresh) {
			VirtualScroll.page = document.getElementById(id);
			if (isNotExist(id, blockType)) {
				return false;
			}

			VirtualScroll.Sizes = Params[blockType];
			var items = VirtualScroll.get(id);

			// если сдвига не произошло ничего не делаем
			if (
				!refresh &&
				VirtualScroll.Pages[id] &&
				equals(VirtualScroll.Pages[id].list, items)
			) {
				return false;
			}

			VirtualScroll.Pages[id] = {};
			VirtualScroll.Pages[id].list = items;
			VirtualScroll.Pages[id].currentItem = Get.currentItem(blockType);

			VirtualScroll.page.querySelector('.content').style.height = Get.heightArea(id) + 'px';

			VirtualScroll.render(id, blockType);

			function isNotExist(id, blockType) {
				if (!VirtualScroll.page) {
					console.log('VirtualScroll: page with id ' + id + ' doesn\'t exist');
					log.add('VirtualScroll: page with id ' + id + ' doesn\'t exist');

					return true;
				}
				if (!Params[blockType]) {
					console.log('VirtualScroll: Params for tv_cur_block ' + blockType + ' is not defined');
					log.add('VirtualScroll: Params for tv_cur_block ' + blockType + ' is not defined');

					return true;
				}

				return false;
			}
		},
		render: function (id, blockType) {
			var template = blockType + '-item';

			if (templates_cache[template]) {
				set(id, template, blockType);
			}
			else {
				loadTemplate('modules/VirtualScroll/templates/' + template + '.html')
					.done(set.bind(null, id, template, blockType));
			}

			function set(id, template, blockType) {
					// массив с данными всех эл-тов
				var data = Get.items(id),
					container = getContainer(blockType),
					fragment = '';

				for (var i = 0; i < VirtualScroll.Pages[id].list.length; i++) {
					var indexes = VirtualScroll.Pages[id].list[i];
					fragment += templates_cache[template].render(getData(data, indexes));
				}

				container.innerHTML = fragment;

				setRelativeData(blockType, container);

				function getContainer(blockType) {
					switch (blockType) {
						case 'tv_channellist':
							return VirtualScroll.page.querySelector('.content');

						case 'VODcategory':
							return VirtualScroll.page.querySelector('.pagelist');
					}
				}
				function getData(data, indexes) {
					return Object.assign(
						{},
						data[indexes.indexOfList],
						{ index: indexes.indexOfList },
						Get.itemPosition(indexes.indexOfFiltratedList)
					);
				}
				function setRelativeData(blockType, container) {
					if (blockType !== tv_cur_block) {
						return false;
					}

					tv_sel_list = $(container).find('li');
					metro_menu_calc(tv_sel_list);

					var currentItem = VirtualScroll.Pages[id].currentItem;
					// используется такое сравнение так как
					// currentItem может быть равен 0
					if (currentItem !== null) {
						tv_cur_elem = $(container).find('li[data-id="'+ currentItem +'"]');

						if (tv_cur_elem.length) {
							tv_cur_elem.addClass('tv_cur tv_sel');

							tv_cur_pos = getTVCurPos();
						}
					}

					function getTVCurPos(list, curElem) {
						if (typeof list === 'undefined') {
							list = tv_sel_list;
						}
						if (typeof curElem === 'undefined') {
							curElem = tv_cur_elem;
						}

						for (var index = 0; index < list.length; index++) {
							if (curElem[0].dataset.id === list[index].dataset.id) {
								return index;
							}
						}
					}
				}
			}
		}
	};

})();
