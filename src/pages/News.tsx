import React, { useState, useEffect } from "react";
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
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

const AdminNews: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState(""); // new state
  const [showToast, setShowToast] = useState(false);
  const [newsList, setNewsList] = useState<any[]>([]);

  // Fetch all news
  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching news:", error.message);
    else setNewsList(data || []);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Add news
  const handleAddNews = async () => {
    if (!title || !content) return;
    const { error } = await supabase.from("news").insert([
      {
        title,
        content,
        image_url: imageUrl,
        created_at: new Date(),
        expires_at: expiresAt ? new Date(expiresAt) : null, // set expiry date
      },
    ]);
    if (error) {
      console.error("Error adding news:", error.message);
    } else {
      setShowToast(true);
      setTitle("");
      setContent("");
      setImageUrl("");
      setExpiresAt("");
      fetchNews(); // refresh list
    }
  };

  // Delete news
  const handleDeleteNews = async (id: number) => {
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) {
      console.error("Error deleting news:", error.message);
    } else {
      fetchNews(); // refresh list
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Manage News</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">

        {/* Add News Form */}
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
        <IonItem>
          <IonLabel position="stacked">Expiry Date</IonLabel>
          <IonInput
            type="date"
            value={expiresAt}
            onIonChange={(e) => setExpiresAt(e.detail.value!)}
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

        {/* News List */}
        <IonList className="ion-margin-top">
          {newsList.map((item) => (
            <IonCard key={item.id}>
              <IonCardHeader>
                <IonCardTitle>{item.title}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>{item.content}</p>
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt="news"
                    style={{ width: "100%", marginTop: "10px", borderRadius: "8px" }}
                  />
                )}
                <p>
                  <strong>Expires:</strong>{" "}
                  {item.expires_at
                    ? new Date(item.expires_at).toLocaleDateString()
                    : "No expiry"}
                </p>
                <IonButton
                  color="danger"
                  expand="block"
                  onClick={() => handleDeleteNews(item.id)}
                >
                  Remove
                </IonButton>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default AdminNews;
