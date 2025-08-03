// ✅ FIXED SubmitTree.tsx (NO auto-points on submit)
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonImg,
  IonText,
  useIonToast,
} from "@ionic/react";
import { useState } from "react";
import * as EXIF from "exif-js";

const SubmitTree: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [exifData, setExifData] = useState<any>(null);
  const [fileName, setFileName] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");
  const [presentToast] = useIonToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const submissionTime = new Date().toISOString();
    setSubmittedAt(submissionTime);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      setImage(imageDataUrl);

      const imgElement = document.createElement("img");
      imgElement.src = imageDataUrl;
      imgElement.crossOrigin = "anonymous";
      imgElement.style.display = "none";
      document.body.appendChild(imgElement);

      imgElement.onload = () => {
        EXIF.getData(imgElement, function () {
          const allMetaData = EXIF.getAllTags(this);
          setExifData(allMetaData);

          // ✅ Save submission, but DO NOT add points yet
          const submissions = JSON.parse(localStorage.getItem("submissions") || "[]");

          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          const submission = {
            fileName,
            image: imageDataUrl,
            exif: allMetaData,
            status: "Pending",
            submittedAt: submissionTime,
            submittedBy: currentUser.email || "Unknown",
          };

          submissions.push(submission);
          localStorage.setItem("submissions", JSON.stringify(submissions));

          presentToast({
            message: "Tree submitted successfully! Awaiting validator approval.",
            duration: 2000,
            position: "top",
            color: "success",
          });

          document.body.removeChild(imgElement);
        });
      };
    };

    reader.readAsDataURL(file);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Submit New Tree</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonButton expand="block">
          <label htmlFor="fileInput" style={{ width: "100%", display: "block", cursor: "pointer" }}>
            Upload / Take Tree Photo
          </label>
        </IonButton>

        <input
          id="fileInput"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          hidden
        />

        {image && (
          <>
            <IonImg src={image} alt="Tree Submission" />
            <IonText>
              <p><strong>File:</strong> {fileName}</p>
              <p><strong>Submitted:</strong> {new Date(submittedAt).toLocaleString()}</p>
              <p><strong>GPS Latitude:</strong> {exifData?.GPSLatitude || "N/A"}</p>
              <p><strong>Date Taken:</strong> {exifData?.DateTime || "N/A"}</p>
              <p><strong>Status:</strong> Pending Validator Review</p>
            </IonText>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SubmitTree;
