import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";

// Files picked from the document/photo picker live in a transient location
// (a content:// URI on Android, a temp path on iOS) that isn't guaranteed to
// still be readable later, so every attachment gets copied into this
// permanent app folder the moment it's added.
// Open native storage only when adding a file. Screens also import this
// module on web and during static rendering, where Paths.document is unavailable.
let attachmentsDir;

const ensureDir = () => {
  if (!attachmentsDir) attachmentsDir = new Directory(Paths.document, "email-attachments");
  if (!attachmentsDir.exists) {
    attachmentsDir.create({ intermediates: true, idempotent: true });
  }
  return attachmentsDir;
};

const storageKey = (username, tab) => `email_attachments_${username}_${tab}`;

export const getAttachments = async (username, tab) => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(username, tab));
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Error reading attachments:", error);
    return [];
  }
};

const saveAttachments = async (username, tab, list) => {
  await AsyncStorage.setItem(storageKey(username, tab), JSON.stringify(list));
  return list;
};

// Copies a picker result ({ uri, name, mimeType, size }) into permanent
// storage and appends it to the saved attachment list for this template.
export const addAttachment = async (username, tab, pickedAsset) => {
  const directory = ensureDir();

  const id = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const safeName = pickedAsset.name || `attachment-${id}`;
  const destination = new File(directory, `${id}-${safeName}`);

  const source = new File(pickedAsset.uri);
  await source.copy(destination);

  const entry = {
    id,
    uri: destination.uri,
    name: safeName,
    mimeType: pickedAsset.mimeType || "application/octet-stream",
    size: pickedAsset.size ?? destination.size ?? 0,
  };

  const current = await getAttachments(username, tab);
  return saveAttachments(username, tab, [...current, entry]);
};

export const removeAttachment = async (username, tab, id) => {
  const current = await getAttachments(username, tab);
  const target = current.find((item) => item.id === id);

  if (target) {
    try {
      const file = new File(target.uri);
      if (file.exists) {
        file.delete();
      }
    } catch (error) {
      console.error("Error deleting attachment file:", error);
    }
  }

  return saveAttachments(username, tab, current.filter((item) => item.id !== id));
};
