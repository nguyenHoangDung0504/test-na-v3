const { trackIDs, CVs, tags } = await initData();
const rs = crawlData();
const { CV_KEYS, TAG_KEYS, EXCLUDE_TAGS } = getConstKeys();

// console.log(trackIDs, CVs, tags);
// console.log(rs);

if (trackIDs.has(rs.code)) {
	console.log('***NOTE: DUPLICATE CODE***');
}

let rsCVstr = '';
const rsCVlist = rs.cvs.map((rsCV) => {
	rsCV = toTitleCase(rsCV);
	return (
		CV_KEYS.get(rsCV) ||
		CVs.find((cv) => cv.toLowerCase() === rsCV.toLowerCase().split(' ').reverse().join(' ')) ||
		rsCV
	);
});
rsCVstr = Array.from(new Set(rsCVlist)).sort().join(',');

let rsTagStr = '';
const rsTagList = rs.tags
	.map((rsTag) => {
		rsTag = toTitleCase(rsTag);
		TAG_KEYS.forEach((value, key) => {
			if (rsTag.toLowerCase().includes(key.toLowerCase())) {
				rsTag = value;
			}
		});
		return rsTag;
	})
	.map((rsTag) => {
		if ([...TAG_KEYS.values()].includes(rsTag)) return rsTag;
		let innerRsTag = [];

		for (let i = 0; i < tags.length; i++) {
			if (rsTag.toLowerCase().includes(tags[i].toLowerCase())) {
				innerRsTag.push(tags[i]);
			}
		}

		return Array.from(new Set(innerRsTag)).join(',');
	})
	.filter(Boolean);
rsTagStr = Array.from(new Set(rsTagList.map((s) => s.split(',')).flat())).sort();
EXCLUDE_TAGS.forEach((value, key) => {
	if (rsTagStr.includes(key)) rsTagStr = rsTagStr.filter((r) => !(r === value));
});
rsTagStr = rsTagStr.join(',');

await copy(
	`at(${rs.code}, "${rs.rjCode}", "${rsCVstr}", "${rsTagStr}", "", "${rs.engName}", "${rs.japName}", t0i0a)`
);

async function copy(value, timeout = 100) {
	const textarea = document.createElement('textarea');
	textarea.value = value;
	document.body.appendChild(textarea);

	await new Promise((resolve) => {
		setTimeout(() => {
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			console.log('copied');
			resolve();
		}, timeout);
	});
}

/**
 * @returns {Promise<{ trackIDs: Set<number>, CVs: string[], tags: string[], series: string[] }>}
 */
async function initData() {
	const module = await import('http://127.0.0.1:5500/@data_compressor/exported-data.js');

	/**@type {[code:number, RJcode:string, CVs:string, tags:string, series:string][]} */
	const data = module.default.map((line) => line.toSpliced(5));

	const trackIDs = new Set();
	let CVs = new Set();
	let tags = new Set();

	data.forEach(([t_code, _, t_CVs, t_tags]) => {
		trackIDs.add(t_code);
		formatCategory(t_CVs).forEach((cv) => CVs.add(cv));
		formatCategory(t_tags).forEach((tag) => tags.add(tag));
	});

	CVs = Array.from(CVs).sort((a, b) => a.localeCompare(b));
	tags = Array.from(tags).sort((a, b) => a.localeCompare(b));

	return { trackIDs, CVs, tags };

	/**@param {string} catStr  */
	function formatCategory(catStr) {
		return catStr
			.split(',')
			.map((c) => c.trim())
			.filter(Boolean);
	}
}

function crawlData() {
	const code = +location.href.match(/\d+/)[0];
	const ps = document.querySelectorAll('p');

	const japName = ps[1].textContent.trim();
	const engName = filterEngName(document.querySelector('h1.page-title').textContent.trim());
	const rjCode = ps[3].textContent.split(': ')[1].trim();

	const cvs = ps[2].textContent
		.split(': ')[1]
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	const tags = [...document.querySelectorAll('.post-meta.post-tags a')]
		.map((ele) => ele.textContent.trim())
		.filter(Boolean);

	return { code, rjCode, japName, engName, cvs, tags };

	/**@param {string} input  */
	function filterEngName(input) {
		let alphabeticCount = input.replace(/[^a-zA-Z]/g, '').length;
		let percentageAlphabetic = (alphabeticCount / input.length) * 100;
		return percentageAlphabetic > 60 ? input : 'engName';
	}
}

function getConstKeys() {
	const TAG_KEYS = new Map([
		['Student', 'School Girl,Student'],
		['School/Academy', 'School'],
		['Imouto', 'Younger Sister'],
		['Oneesan', 'Elder Sister'],
		['Breast Sex', 'Paizuri'],
		['Trap', 'Crossdress'],
		['Voluptuous/Plump', 'Chubby'],
		['Real Elder Sister', 'Sister,Oneesan,Incest'],
		['Mommie', 'Mother,Milf'],
		['Mother', 'Mother,Milf'],
		['Jock/Athlete/Sports', 'Sport Girl'],
		['Cohabitation', 'Living Together'],
		['Lovers', 'Girlfriend'],
	]);

	const CV_KEYS = new Map([
		['Momoka Yuzuki', 'MOMOKA'],
		['Aruha Kotone', 'Kotone Akatsuki'],
	]);

	const EXCLUDE_TAGS = new Map([
		['Ear Licking', 'Licking'],
		['School Uniform', 'Uniform'],
	]);

	return { TAG_KEYS, CV_KEYS, EXCLUDE_TAGS };
}

/**@param {string} str */
function toTitleCase(str) {
	return str
		.toLowerCase()
		.split(/\s+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}
