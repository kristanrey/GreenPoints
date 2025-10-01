import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonToast,
  IonTextarea,
  IonSpinner,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

const CreateReward: React.FC = () => {
  const [name, setName] = useState("");
  const [points, setPoints] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleSubmit = async () => {
    if (!name || !points) {
      setToastMessage("⚠️ Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("rewards").insert([
        {
          name,
          points,
          description,
          image_url: imageUrl,
        },
      ]);

      if (error) throw error;

      setToastMessage("✅ Reward created successfully!");
      setName("");
      setPoints(null);
      setDescription("");
      setImageUrl("");
    } catch (err: any) {
      setToastMessage("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Create Reward</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Reward Name *</IonLabel>
          <IonInput
            value={name}
            onIonChange={(e) => setName(e.detail.value!)}
            placeholder="Enter reward name"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Points Required *</IonLabel>
          <IonInput
            type="number"
            value={points ?? ""}
            onIonChange={(e) => setPoints(parseInt(e.detail.value!))}
            placeholder="Enter required points"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Description</IonLabel>
          <IonTextarea
            value={description}
            onIonChange={(e) => setDescription(e.detail.value!)}
            placeholder="Enter reward description"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Image URL</IonLabel>
          <IonInput
            value={imageUrl}
            onIonChange={(e) => setImageUrl(e.detail.value!)}
            placeholder="Enter image URL (optional)"
          />
        </IonItem>

        <div className="ion-text-center ion-padding">
          <IonButton expand="block" onClick={handleSubmit} disabled={loading}>
            {loading ? <IonSpinner name="crescent" /> : "Create Reward"}
          </IonButton>
        </div>

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default CreateReward;
