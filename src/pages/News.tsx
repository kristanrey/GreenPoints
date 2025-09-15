import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonToast,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

const AdminNews: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleAddNews = async () => {
    if (!title || !content) return;
    const { error } = await supabase.from("news").insert([
      {
        title,
        content,
        image_url: imageUrl,
        created_at: new Date(),
      },
    ]);
    if (error) {
      console.error("Error adding news:", error.message);
    } else {
      setShowToast(true);
      setTitle("");
      setContent("");
      setImageUrl("");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add News</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Title</IonLabel>
          <IonInput
            value={title}
            onIonChange={(e) => setTitle(e.detail.value!)}
            placeholder="Enter news title"
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Content</IonLabel>
          <IonTextarea
            value={content}
            onIonChange={(e) => setContent(e.detail.value!)}
            placeholder="Enter news content"
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Image URL (optional)</IonLabel>
          <IonInput
            value={imageUrl}
            onIonChange={(e) => setImageUrl(e.detail.value!)}
            placeholder="https://example.com/image.jpg"
          />
        </IonItem>
        <IonButton expand="block" className="ion-margin-top" onClick={handleAddNews}>
          Post News
        </IonButton>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="News posted successfully!"
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminNews;
