import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonTextarea,
  IonImg,
  IonDatetime,
  IonLoading,
  IonToast,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

const UploadTreeGallery: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>("");
  const [locationDescription, setLocationDescription] = useState<string>("");
  const [datePlanted, setDatePlanted] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Upload image to Supabase Storage and insert into tree_gallery table
  const uploadGalleryPhoto = async () => {
    if (!imageFile) {
      setToastMessage("Please choose an image first.");
      return;
    }

    setUploading(true);

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `gallery_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage bucket: "tree_gallery"
      const { data: storageData, error: uploadError } = await supabase.storage
        .from("tree_gallery")
        .upload(fileName, imageFile);

      if (uploadError || !storageData) throw uploadError || new Error("Upload failed");

      // Get public URL (TypeScript-safe)
      const { data: publicUrlData } = supabase.storage
        .from("tree_gallery")
        .getPublicUrl(storageData.path);

      if (!publicUrlData?.publicUrl) throw new Error("Failed to get public URL");
      const imageUrl = publicUrlData.publicUrl;

      // Insert record into tree_gallery table (RLS policy allows this)
      const { error: insertError } = await supabase.from("tree_gallery").insert([
        {
          image_url: imageUrl,
          caption,
          location_description: locationDescription,
          date_planted: datePlanted,
        },
      ]);

      if (insertError) throw insertError;

      // Reset form and show success message
      setToastMessage("Image uploaded successfully!");
      setImageFile(null);
      setImagePreview(null);
      setCaption("");
      setLocationDescription("");
      setDatePlanted("");
    } catch (err: any) {
      console.error(err);
      setToastMessage(err.message || "Something went wrong!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>Upload Tree Gallery</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Image Upload */}
        <IonItem>
          <IonLabel>Select Photo</IonLabel>
          <input type="file" accept="image/*" onChange={handleImageSelect} />
        </IonItem>

        {imagePreview && (
          <IonImg
            src={imagePreview}
            style={{ marginTop: 20, borderRadius: 12 }}
          />
        )}

        {/* Caption */}
        <IonItem>
          <IonLabel position="stacked">Caption</IonLabel>
          <IonTextarea
            value={caption}
            onIonChange={(e) => setCaption(e.detail.value || "")}
          />
        </IonItem>

        {/* Location Description */}
        <IonItem>
          <IonLabel position="stacked">Location Description</IonLabel>
          <IonTextarea
            value={locationDescription}
            onIonChange={(e) => setLocationDescription(e.detail.value || "")}
          />
        </IonItem>

        {/* Date Planted */}
        <IonItem>
          <IonLabel>Date Planted</IonLabel>
          <IonDatetime
            presentation="date"
            value={datePlanted}
            onIonChange={(e) => setDatePlanted(String(e.detail.value))}
          />
        </IonItem>

        {/* Upload Button */}
        <IonButton
          expand="block"
          color="success"
          style={{ marginTop: 20 }}
          onClick={uploadGalleryPhoto}
        >
          Upload Photo
        </IonButton>

        {/* Loading & Toast */}
        <IonLoading isOpen={uploading} message="Uploading..." />
        <IonToast
          isOpen={toastMessage !== ""}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default UploadTreeGallery;
