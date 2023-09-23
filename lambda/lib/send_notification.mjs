import { domain, vapid_key, vapid_private_key } from "../data/config.mjs";
import { webPush } from 'web-push-min';
import get_subscription from "./get_subscription.mjs";

/** @typedef {string} NotificationType */

/** @enum {NotificationType} */
export const NotificationTypes = {
	FAVOURITE: 'favourite',
	MENTION: 'mention',
	FOLLOW: 'follow',
	REBLOG: 'reblog',
	FOLLOR_REQUEST: 'follow_request',
	UNFOLLOR: 'unfollow',
	STATUS: 'status',
};

const notification_types = Object.values(NotificationTypes);

/**
 * 
 * @param {NotificationType} type 
 * @returns {string} url
 */
const get_icon_uri = type => notification_types.includes(type) ? `https://${domain}/icon/${type}.png` : `https://${domain}/icon/undefined.png`;

/**
 * マストドン通知用オブジェクトの作成
 * @param {NotificationType} type
 * @param {string} text
 * @param {?string} title
 * @returns {MastodonNotificationMessage}
 */
const generate_mastodon_notification = (type, text, title) => {
	if (!notification_types.includes(type)) throw 'Unknown type';

	return {
		preferred_locale: 'ja',
		icon: encodeURIComponent(get_icon_uri(type)),
		notification_type: type,
		notification_id: new Date().getTime(),
		title,
		body: text,
	};
};

/**
 * @param {number} account_id
 * @param {NotificationType} type
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export const send_notification = (account_id, type, text) => {
	const options = {
		publicKey: vapid_key,
		privateKey: vapid_private_key,
		subject: 'Mastdn on halzion.net',
	};
	return get_subscription(account_id)
		.then(subscription => {
			const payload = generate_mastodon_notification(type, text);

			console.debug(webPush);
			console.debug(subscription);
			console.debug(payload);
			console.debug(options);
			return webPush.sendNotification(
				subscription,
				JSON.stringify(paylod),
				options);
		})
		.then(() => true)
		.catch(err => {
			console.error(err);
			return false;
		});
};

export default {
	send_notification,
	NotificationTypes,
};
