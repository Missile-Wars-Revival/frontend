import UserNotifications
import Intents
 
class NotificationService: UNNotificationServiceExtension {
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
 
  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    bestAttemptContent =
      (request.content.mutableCopy() as? UNMutableNotificationContent)
 
    guard let bestAttemptContent = bestAttemptContent else {
      contentHandler(request.content)
      return
    }

    applyCommunicationMetadataIfNeeded(to: bestAttemptContent, userInfo: request.content.userInfo) { content in
      // If the notification already has attachments (Expo handles richContent
      // server-side for newer SDK versions), deliver as-is.
      if !content.attachments.isEmpty {
        contentHandler(content)
        return
      }

      // Fallback: check for image URL in the data payload (_richContent)
      // for notifications sent before the richContent migration.
      if let imageUrl = self.extractLegacyRichImageUrl(from: request.content.userInfo) {
        self.downloadAndAttachImage(url: imageUrl, to: content) { enriched in
          contentHandler(enriched)
        }
      } else {
        contentHandler(content)
      }
    }
  }

  private func applyCommunicationMetadataIfNeeded(
    to content: UNMutableNotificationContent,
    userInfo: [AnyHashable: Any],
    completion: @escaping (UNMutableNotificationContent) -> Void
  ) {
    guard #available(iOS 15.0, *) else {
      completion(content)
      return
    }

    guard
      let data = extractPayloadData(from: userInfo),
      let isCommunication = data["communication"] as? Bool,
      isCommunication
    else {
      completion(content)
      return
    }

    let senderName = ((data["senderName"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)).flatMap { $0.isEmpty ? nil : $0 } ?? "Someone"
    let senderId = (data["fromUserId"] as? String) ?? (data["senderId"] as? String) ?? senderName
    let threadId = (data["communicationThreadId"] as? String) ?? "communication.\(senderId)"
    let senderAvatarUrl = data["senderAvatarUrl"] as? String

    loadSenderImage(from: senderAvatarUrl) { senderImage in
      let sender = INPerson(
        personHandle: INPersonHandle(value: senderId, type: .unknown),
        nameComponents: nil,
        displayName: senderName,
        image: senderImage,
        contactIdentifier: nil,
        customIdentifier: senderId,
        isMe: false,
        suggestionType: .none
      )

      let me = INPerson(
        personHandle: INPersonHandle(value: "me", type: .unknown),
        nameComponents: nil,
        displayName: nil,
        image: nil,
        contactIdentifier: nil,
        customIdentifier: "me",
        isMe: true,
        suggestionType: .none
      )

      let intent = INSendMessageIntent(
        recipients: [me],
        outgoingMessageType: .outgoingMessageText,
        content: content.body,
        speakableGroupName: nil,
        conversationIdentifier: threadId,
        serviceName: "Missile Wars",
        sender: sender,
        attachments: nil
      )

      let interaction = INInteraction(intent: intent, response: nil)
      interaction.direction = .incoming
      interaction.donate(completion: nil)

      do {
        if let updated = try content.updating(from: intent) as? UNMutableNotificationContent {
          if updated.threadIdentifier.isEmpty {
            updated.threadIdentifier = threadId
          }
          completion(updated)
        } else {
          content.threadIdentifier = threadId
          completion(content)
        }
      } catch {
        content.threadIdentifier = threadId
        completion(content)
      }
    }
  }

  private func loadSenderImage(from imageUrlString: String?, completion: @escaping (INImage?) -> Void) {
    guard
      let imageUrlString,
      let imageUrl = URL(string: imageUrlString)
    else {
      completion(nil)
      return
    }

    let task = URLSession.shared.dataTask(with: imageUrl) { data, _, _ in
      guard let data else {
        completion(nil)
        return
      }
      completion(INImage(imageData: data))
    }
    task.resume()
  }

  private func extractPayloadData(from userInfo: [AnyHashable: Any]) -> [String: Any]? {
    if let directData = userInfo["data"] as? [String: Any] {
      return directData
    }

    if let body = userInfo["body"] as? [String: Any] {
      if let nestedData = body["data"] as? [String: Any] {
        return nestedData
      }
      return body
    }

    return nil
  }

  private func extractLegacyRichImageUrl(from userInfo: [AnyHashable: Any]) -> URL? {
    if let body = userInfo["body"] as? [String: Any],
       let richContent = body["_richContent"] as? [String: Any],
       let imageUrlString = richContent["image"] as? String,
       let imageUrl = URL(string: imageUrlString) {
      return imageUrl
    }

    if let data = extractPayloadData(from: userInfo),
       let imageUrlString = data["imageUrl"] as? String,
       let imageUrl = URL(string: imageUrlString) {
      return imageUrl
    }

    return nil
  }
 
  private func downloadAndAttachImage(
    url: URL,
    to content: UNMutableNotificationContent,
    completion: @escaping (UNNotificationContent) -> Void
  ) {
    let task = URLSession.shared.downloadTask(with: url) { temporaryFileLocation, _, error in
      guard let temporaryFileLocation = temporaryFileLocation else {
        completion(content)
        return
      }
 
      let fileManager = FileManager.default
      let tempDirectory = URL(fileURLWithPath: NSTemporaryDirectory())
      let targetFileName = temporaryFileLocation.lastPathComponent + ".jpg"
      let targetUrl = tempDirectory.appendingPathComponent(targetFileName)
 
      try? fileManager.removeItem(at: targetUrl)
 
      do {
        try fileManager.moveItem(at: temporaryFileLocation, to: targetUrl)
 
        let attachment = try UNNotificationAttachment(
          identifier: "image",
          url: targetUrl,
          options: nil
        )
 
        content.attachments = [attachment]
      } catch {
        print("Error processing attachment: \(error.localizedDescription)")
      }
 
      completion(content)
    }
 
    task.resume()
  }
 
  override func serviceExtensionTimeWillExpire() {
    if let contentHandler = contentHandler,
      let bestAttemptContent = bestAttemptContent {
      contentHandler(bestAttemptContent)
    }
  }
}
